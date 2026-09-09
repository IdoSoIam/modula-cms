import { db } from "#modula/server/data/client";
import { AuthService } from "#modula/server/services/auth/authService";
import { sendUserInvitationEmail } from "#modula/server/services/auth/userInvitation";
import {
  createStripeCheckoutSession,
  isStripeConfigured,
} from "#modula/server/services/payment/paymentService";
import { sendShopOrderCreatedNotifications } from "#modula/server/services/shop/shopOrderEmails";
import { requiresManualRentalApproval, resolveRentalOrderStatus } from '#modula/server/services/shop/rentalApproval'
import {
  getRentalDepositPaymentCapabilities,
  getRentalDepositRegistryOrderId,
  isRentalDepositPaymentModeAvailable,
  type RentalDepositPaymentMode,
} from '#modula/shared/rentalDeposit'
import { getReservationFulfillment } from "#modula/server/utils/orderFulfillment";
import {
  getOnSitePickupConfig,
  getFeatureFlags,
  getRentalCalendarConfig,
} from "#modula/server/utils/settings";
import {
  createOrderNumber,
  hydrateProductBillingDocumentMetadata,
  pickProductLocalizedText,
  resolveProductOptionGroups,
  serializeProduct,
  serializeShopOrder,
} from "#modula/server/utils/shop";
import {
  ensureRentalAvailability,
  isHourlyRentalWindow,
  resolveRentalWindow,
} from "#modula/server/services/shop/rentalAvailability";
import { getResolvedPublicDictionary } from '#modula/server/utils/publicDictionary'
import { getSiteDefaultLocale, getSiteLocales } from '#modula/server/utils/settings'
import {
  getProductOptionCalculatedUnitPrice,
  getProductOptionChargedQuantity,
  type ProductOption,
  type ProductOptionSelectionInput,
} from '#modula/shared/productOptions'
import { resolveRentalRatePrice } from '#modula/shared/rentalRates'

interface OrderLineInput {
  kind: "product";
  productId?: number;
  quantity?: number;
  saleType?: "SALE" | "RENTAL";
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
  rentalPricingMode?: "HOURLY" | "DAILY" | null;
  insuranceDocumentIds?: number[];
  optionSelections?: ProductOptionSelectionInput[];
}

interface OrderBody {
  customerName: string;
  email: string;
  language?: string | null;
  retryOrderId?: number | null;
  phone?: string | null;
  message?: string | null;
  paymentMode?: "offline" | "stripe";
  depositPaymentMode?: "onsite" | "online";
  deliveryType?: "ONSITE" | "PICKUP" | "TOUR";
  pickupPointId?: number | null;
  deliveryTourId?: number | null;
  deliveryAddress?: string | null;
  deliveryCity?: string | null;
  deliveryPostalCode?: string | null;
  lines?: OrderLineInput[];
}

const authService = new AuthService();

export default defineEventHandler(async (event) => {
  const body = await readBody<OrderBody>(event);
  const sessionUser = await authService.getUserFromSession(event);
  const language = /^[a-z]{2}(?:-[a-z]{2})?$/.test(String(body.language || "").trim().toLowerCase())
    ? String(body.language).trim().toLowerCase()
    : "fr";
  const retryOrderId = Number(body.retryOrderId);

  if (!body.customerName?.trim() || !body.email?.trim()) {
    throw createError({
      statusCode: 400,
      message: "Informations client incomplètes",
    });
  }

  const normalizedEmail = body.email.trim().toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw createError({ statusCode: 400, message: "Email invalide" });
  }

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (!lines.length) {
    throw createError({ statusCode: 400, message: "Panier vide" });
  }

  const retryOrder =
    Number.isFinite(retryOrderId) && retryOrderId > 0
      ? await db.shopOrder.findUnique({
          where: { id: retryOrderId },
          include: {
            lines: true,
          },
        })
      : null;

  if (Number.isFinite(retryOrderId) && retryOrderId > 0 && !retryOrder) {
    throw createError({
      statusCode: 404,
      message: "Commande à relancer introuvable",
    });
  }

  if (retryOrder) {
    if (String(retryOrder.email || "").trim().toLowerCase() !== normalizedEmail) {
      throw createError({
        statusCode: 403,
        message: "Cette commande ne correspond pas à cet email",
      });
    }
    if (
      retryOrder.paymentStatus === "PAID"
      || ["CONFIRMED", "IN_PREPARATION", "READY", "IN_DELIVERY", "COMPLETED"].includes(String(retryOrder.status || ""))
    ) {
      throw createError({
        statusCode: 400,
        message: "Cette commande est déjà payée",
      });
    }
  }

  const productIds = Array.from(
    new Set(
      lines
        .filter((line) => line.kind === "product" && Number(line.productId) > 0)
        .map((line) => Number(line.productId)),
    ),
  );

  const directProducts = productIds.length
    ? await db.product.findMany({ where: { id: { in: productIds }, active: true, deletedAt: null } })
    : [];

  const productMapSource = new Map<
    number,
    ReturnType<typeof serializeProduct>
  >();

  for (const row of directProducts) {
    const serialized = await hydrateProductBillingDocumentMetadata(await resolveProductOptionGroups(serializeProduct(row)));
    productMapSource.set(serialized.id, serialized);
  }

  const productById = productMapSource;

  const rentalCalendar = await getRentalCalendarConfig();
  const normalizedLines = lines.map((line) => {
    const quantity = Math.max(1, Math.round(Number(line.quantity || 1)));
    const product = productById.get(Number(line.productId));
    if (!product) {
      throw createError({
        statusCode: 400,
        message: "Produit introuvable dans le panier",
      });
    }

    const rentalWindow = product.saleType === "RENTAL"
      ? resolveRentalWindow(line.rentalStartDate, line.rentalEndDate, rentalCalendar.timezone)
      : null;
    const rentalPricingMode = rentalWindow
      ? resolveRentalPricingMode(product.rentalBookingMode, rentalWindow, line.rentalPricingMode)
      : null;
    const unitPrice = rentalWindow
      ? calculateRentalPrice(product, rentalWindow, rentalPricingMode!)
      : product.price;
    const requestedInsuranceIds = new Set(
      (Array.isArray(line.insuranceDocumentIds) ? line.insuranceDocumentIds : [])
        .map(Number)
        .filter(id => Number.isInteger(id) && id > 0),
    );
    const linkedItems = product.detailSections.flatMap(section => section.items);
    const linkedInsuranceDocuments = uniqueBillingDocumentItems(linkedItems.filter(item =>
      item.mediaKind === 'billingDocument'
      && item.mediaDocumentId
      && item.mediaDocumentKind === 'ASSURANCE',
    ));
    const allowedInsuranceIds = new Set(linkedInsuranceDocuments.map(item => Number(item.mediaDocumentId)));
    if (Array.from(requestedInsuranceIds).some(id => !allowedInsuranceIds.has(id))) {
      throw createError({ statusCode: 400, message: 'Une assurance sélectionnée n’est pas liée à ce produit' });
    }
    const includedInsuranceDocuments = rentalWindow
      ? linkedInsuranceDocuments.filter(item => item.mediaDocumentRequiredForRental || requestedInsuranceIds.has(Number(item.mediaDocumentId)))
      : [];
    const rentalDurationUnits = rentalWindow
      ? getRentalDurationUnits(rentalWindow, rentalPricingMode!)
      : null;
    const linkedBillingDocuments = uniqueBillingDocumentItems(linkedItems.filter(item =>
      item.mediaKind === 'billingDocument'
      && item.mediaDocumentId
      && (item.mediaDocumentKind !== 'ASSURANCE' || includedInsuranceDocuments.some(insurance => insurance.mediaDocumentId === item.mediaDocumentId)),
    )).map(item => ({
      id: item.mediaDocumentId,
      name: item.mediaDocumentName,
      kind: item.mediaDocumentKind,
    }));
    const linkedFiles = linkedItems
      .filter(item => item.mediaKind === 'pdf' && item.mediaUrl)
      .map(item => ({ name: pickProductLocalizedText(language, item.labelLocalized, item.label), url: item.mediaUrl }));

    return {
      kind: "product" as const,
      quantity,
      title: pickProductLocalizedText(language, product.nameLocalized, product.name),
      productId: product.id,
      unitPrice,
      totalPrice: unitPrice * quantity,
      vatRate: product.vatRate,
      stock: product.stock,
      allowOfflinePayment: product.allowOfflinePayment,
      allowOnlinePayment: product.allowOnlinePayment,
      saleType: product.saleType,
      imageUrl: product.imageUrl,
      description: pickProductLocalizedText(language, product.excerptLocalized)
        || pickProductLocalizedText(language, product.descriptionLocalized)
        || product.excerpt || product.description || undefined,
      metaJson: JSON.stringify({
        slug: product.slug,
        saleType: product.saleType,
        unitLabel: product.unitLabel,
        rentalPricingMode,
        rentalDurationUnits,
        vatRate: product.vatRate,
        paymentTaxCode: product.paymentTaxCode,
        paymentTaxBehavior: product.paymentTaxBehavior,
        allowCustomerCancellation: product.allowCustomerCancellation,
        allowRefundRequestAfterEngagement: product.allowRefundRequestAfterEngagement,
        rentalApprovalMode: product.rentalApprovalMode,
        rentalDepositAmount: product.rentalDepositAmount,
        rentalDepositAllowOnsitePayment: product.rentalDepositAllowOnsitePayment,
        rentalDepositAllowOnlinePayment: product.rentalDepositAllowOnlinePayment,
        rentalLateFeeEnabled: product.rentalLateFeeEnabled,
        rentalLateFeeMode: product.rentalLateFeeMode,
        rentalLateFeeAmount: product.rentalLateFeeAmount,
        rentalLateFeeMultiplier: product.rentalLateFeeMultiplier,
        rentalLateFeeGraceMinutes: product.rentalLateFeeGraceMinutes,
        rentalLateFeeMinimum: product.rentalLateFeeMinimum,
        rentalLateFeeMaximum: product.rentalLateFeeMaximum,
        rentalLateFeeVatRate: product.rentalLateFeeVatRate ?? product.vatRate,
        rentalHourlyPrice: product.rentalHourlyPrice,
        rentalDailyPrice: product.rentalDailyPrice,
        linkedBillingDocuments,
        linkedFiles,
      }),
      paymentTaxCode: product.paymentTaxCode,
      paymentTaxBehavior: product.paymentTaxBehavior,
      rentalAvailableFrom: product.rentalAvailableFrom,
      rentalAvailableTo: product.rentalAvailableTo,
      rentalMinDays: product.rentalMinDays,
      rentalMaxDays: product.rentalMaxDays,
      rentalBookingMode: product.rentalBookingMode,
      rentalApprovalMode: product.rentalApprovalMode,
      rentalDurations: product.rentalDurations,
      rentalSlotStepMinutes: product.rentalSlotStepMinutes,
      rentalDepositAmount: product.rentalDepositAmount,
      rentalDepositAllowOnsitePayment: product.rentalDepositAllowOnsitePayment,
      rentalDepositAllowOnlinePayment: product.rentalDepositAllowOnlinePayment,
      rentalPricingMode,
      rentalWindow,
      includedInsuranceDocuments,
      rentalDurationUnits,
      product,
      requestedOptionSelections: Array.isArray(line.optionSelections) ? line.optionSelections : [],
    };
  });

  const insuranceLines = normalizedLines.flatMap(line => line.includedInsuranceDocuments.map(document => {
    const unitPrice = calculateRentalInsurancePrice(document, line.rentalDurationUnits!, line.rentalPricingMode!);
    return {
      kind: 'insurance' as const,
      quantity: line.quantity,
      title: document.mediaDocumentName || 'Assurance',
      productId: null,
      unitPrice,
      totalPrice: unitPrice * line.quantity,
      vatRate: line.vatRate,
      allowOfflinePayment: line.allowOfflinePayment,
      allowOnlinePayment: line.allowOnlinePayment,
      saleType: 'INSURANCE' as const,
      imageUrl: null,
      description: undefined,
      paymentTaxCode: line.paymentTaxCode,
      paymentTaxBehavior: line.paymentTaxBehavior,
      rentalWindow: null,
      metaJson: JSON.stringify({
        lineKind: 'INSURANCE',
        relatedProductId: line.productId,
        billingDocumentId: document.mediaDocumentId,
        required: document.mediaDocumentRequiredForRental,
        rentalPricingMode: line.rentalPricingMode,
        rentalDurationUnits: line.rentalDurationUnits,
        vatRate: line.vatRate,
        paymentTaxCode: line.paymentTaxCode,
        paymentTaxBehavior: line.paymentTaxBehavior,
        linkedBillingDocuments: [],
      }),
    };
  }));
  const optionLines = normalizedLines.flatMap(line => buildProductOptionLines(line, language));
  const orderLines = [...normalizedLines, ...insuranceLines, ...optionLines];

  const rentalLines = [...normalizedLines, ...optionLines].filter((line) => line.saleType === "RENTAL");
  const depositLines = rentalLines.filter(line => Number(line.rentalDepositAmount || 0) > 0)
  const depositAmount = Math.round(depositLines.reduce(
    (sum, line) => sum + Number(line.rentalDepositAmount || 0) * line.quantity,
    0,
  ) * 100) / 100
  const retryDeposit = retryOrder
    ? await db.rentalDeposit.findUnique({ where: { orderId: Number(retryOrder.id) } })
    : null
  const depositAlreadyCollected = Boolean(retryDeposit && ['PAID', 'PARTIALLY_RETAINED', 'RETAINED', 'RELEASED'].includes(String(retryDeposit.status)))
  if (depositAlreadyCollected && Math.abs(Number(retryDeposit?.amount || 0) - depositAmount) > 0.001) {
    throw createError({ statusCode: 409, message: 'La commande ne peut plus être modifiée après le versement de son dépôt de garantie' })
  }

  if (rentalLines.length) {
    const featureFlags = await getFeatureFlags()
    if (!featureFlags.rentalsEnabled) {
      throw createError({ statusCode: 400, message: 'La location est actuellement désactivée' })
    }
    const [siteLocales, defaultLocale] = await Promise.all([getSiteLocales(), getSiteDefaultLocale()])
    const dictionary = await getResolvedPublicDictionary(language, siteLocales, defaultLocale)
    await ensureRentalAvailability(
      rentalLines.map((line) => ({
        kind: 'product' as const,
        id: line.productId ?? 0,
        title: line.title,
        quantity: line.quantity,
        stock: line.stock,
        rentalAvailableFrom: line.rentalAvailableFrom,
        rentalAvailableTo: line.rentalAvailableTo,
        rentalMinDays: line.rentalMinDays,
        rentalMaxDays: line.rentalMaxDays,
        rentalBookingMode: line.rentalBookingMode,
        rentalDurations: line.rentalDurations,
        rentalSlotStepMinutes: line.rentalSlotStepMinutes,
        rentalPricingMode: line.rentalPricingMode,
        rentalWindow: line.rentalWindow,
      })),
      retryOrder
        ? {
            excludedOrderIds: [Number(retryOrder.id)],
            message: (key, params) => interpolate(dictionary[key] || '', params),
          }
        : { message: (key, params) => interpolate(dictionary[key] || '', params) },
    );
  }

  const allowOffline = orderLines.every(
    (line) => line.allowOfflinePayment,
  );
  const stripeConfigured = await isStripeConfigured();
  const allowOnline =
    stripeConfigured &&
    orderLines.every((line) => line.allowOnlinePayment);
  const paymentMode =
    body.paymentMode === "stripe"
      ? "stripe"
      : body.paymentMode === "offline"
        ? "offline"
        : allowOnline && !allowOffline
          ? "stripe"
          : "offline";
  const depositCapabilities = getRentalDepositPaymentCapabilities(depositLines, stripeConfigured)
  const requestedDepositPaymentMode: RentalDepositPaymentMode = body.depositPaymentMode === 'online'
    ? 'ONLINE'
    : body.depositPaymentMode === 'onsite' ? 'ONSITE' : depositCapabilities.defaultMode
  const depositPaymentMode = depositAlreadyCollected
    ? retryDeposit!.paymentMode as RentalDepositPaymentMode
    : requestedDepositPaymentMode

  if (!allowOffline && !allowOnline) {
    throw createError({
      statusCode: 400,
      message: "Aucun mode de paiement compatible pour ce panier",
    });
  }
  if (paymentMode === "stripe" && !allowOnline) {
    throw createError({
      statusCode: 400,
      message: "Le paiement en ligne n’est pas disponible pour ce panier",
    });
  }
  if (paymentMode === "offline" && !allowOffline) {
    throw createError({
      statusCode: 400,
      message: "Le paiement sur place n’est pas disponible pour ce panier",
    });
  }
  if (depositAmount > 0 && !depositAlreadyCollected && !isRentalDepositPaymentModeAvailable(depositPaymentMode, depositCapabilities)) {
    throw createError({
      statusCode: 400,
      message: depositPaymentMode === 'ONLINE'
        ? 'Le versement en ligne du dépôt de garantie n’est pas disponible pour ce panier'
        : 'Le versement sur place du dépôt de garantie n’est pas disponible pour ce panier',
    })
  }

  const requiredStocks = new Map<number, number>();
  const previouslyReservedStocks = new Map<number, number>();
  for (const line of retryOrder?.lines ?? []) {
    const productId = Number(line.productId || 0);
    if (!productId) continue;
    previouslyReservedStocks.set(
      productId,
      (previouslyReservedStocks.get(productId) || 0) + Number(line.quantity || 0),
    );
  }
  for (const line of [...normalizedLines, ...optionLines]) {
    if (line.saleType === "RENTAL") {
      continue;
    }
    if (!line.productId) continue;
    requiredStocks.set(
      line.productId,
      (requiredStocks.get(line.productId) || 0) + line.quantity,
    );
  }

  for (const [productId, requiredQuantity] of requiredStocks.entries()) {
    const product = [...normalizedLines, ...optionLines].find(line => line.productId === productId);
    const previouslyReservedQuantity = previouslyReservedStocks.get(productId) || 0;
    const availableQuantity = (product?.stock || 0) + previouslyReservedQuantity;
    if (!product || availableQuantity < requiredQuantity) {
      throw createError({
        statusCode: 400,
        message: `Stock insuffisant pour ${product?.title || `#${productId}`}`,
      });
    }
  }

  const subtotal = orderLines.reduce(
    (sum, line) => sum + line.totalPrice,
    0,
  );
  const orderRentalStartDate = rentalLines.length
    ? rentalLines.reduce((current, line) => {
        const value = line.rentalWindow?.rentalStartDate ?? null;
        if (!value) return current;
        if (!current) return value;
        return value < current ? value : current;
      }, null as string | null)
    : null;
  const orderRentalEndDate = rentalLines.length
    ? rentalLines.reduce((current, line) => {
        const value = line.rentalWindow?.rentalEndDate ?? null;
        if (!value) return current;
        if (!current) return value;
        return value > current ? value : current;
      }, null as string | null)
    : null;
  const useStripe = paymentMode === "stripe" && allowOnline;
  const manualRentalApproval = requiresManualRentalApproval(rentalLines);
  const onSitePickup = await getOnSitePickupConfig();
  const accountProvisioning = await resolveOrderAccountProvisioning({
    sessionUserId: sessionUser?.id ?? null,
    email: normalizedEmail,
    customerName: body.customerName.trim(),
    locale: language,
  });
  const accountProvisioningFeedback = {
    invitationSent: accountProvisioning.invitationSent,
    linkedToExistingAccount: accountProvisioning.linkedToExistingAccount,
    createdInvitedAccount: accountProvisioning.createdInvitedAccount,
  };

  let deliveryType: "ONSITE" | "PICKUP" | "TOUR";
  let pickupPointId: number | null = null;
  let deliveryTourId: number | null = null;
  let pickupPoint: {
    id: number;
    name: string;
    address: string | null;
    deliveryDay: number | null;
    pickupStartTime: string | null;
  } | null = null;
  let deliveryTour: {
    id: number;
    name: string;
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  } | null = null;

  if (rentalLines.length && body.deliveryType !== "ONSITE") {
    throw createError({
      statusCode: 400,
      message: "Une location doit être retirée et retournée sur place aux heures sélectionnées",
    });
  }

  if (body.deliveryType === "ONSITE") {
    deliveryType = "ONSITE";
  } else if (body.deliveryType === "PICKUP") {
    if (!body.pickupPointId) {
      throw createError({
        statusCode: 400,
        message: "Point relais requis",
      });
    }

    const row = await db.pickupPoint.findUnique({
      where: { id: Number(body.pickupPointId) },
      select: {
        id: true,
        active: true,
        deletedAt: null,
        name: true,
        address: true,
        deliveryDay: true,
        pickupStartTime: true,
      },
    });

    if (!row || !row.active) {
      throw createError({
        statusCode: 400,
        message: "Point relais invalide",
      });
    }

    deliveryType = "PICKUP";
    pickupPointId = Number(row.id);
    pickupPoint = {
      id: Number(row.id),
      name: String(row.name),
      address: row.address ?? null,
      deliveryDay: row.deliveryDay == null ? null : Number(row.deliveryDay),
      pickupStartTime: row.pickupStartTime ?? null,
    };
  } else if (body.deliveryType === "TOUR") {
    if (!body.deliveryTourId) {
      throw createError({
        statusCode: 400,
        message: "Livraison requise",
      });
    }
    if (!body.deliveryCity?.trim()) {
      throw createError({
        statusCode: 400,
        message: "Ville requise pour la livraison",
      });
    }
    if (!body.deliveryAddress?.trim()) {
      throw createError({
        statusCode: 400,
        message: "Adresse requise pour la livraison",
      });
    }

    const row = await db.deliveryTour.findUnique({
      where: { id: Number(body.deliveryTourId) },
      select: {
        id: true,
        active: true,
        deletedAt: null,
        name: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!row || !row.active) {
      throw createError({
        statusCode: 400,
        message: "Créneau de livraison invalide",
      });
    }

    const servedCities = await db.tourCity.findMany({
      where: { tourId: Number(row.id) },
      select: { city: true },
    });

    const cityLower = body.deliveryCity.trim().toLowerCase();
    const cityAllowed = servedCities.some(
      (entry: any) => String(entry.city).trim().toLowerCase() === cityLower,
    );

    if (!cityAllowed) {
      throw createError({
        statusCode: 400,
        message:
          "Cette ville n'est pas desservie par le créneau de livraison sélectionné",
      });
    }

    deliveryType = "TOUR";
    deliveryTourId = Number(row.id);
    deliveryTour = {
      id: Number(row.id),
      name: String(row.name),
      dayOfWeek: Number(row.dayOfWeek),
      startTime: String(row.startTime),
      endTime: String(row.endTime),
    };
  } else {
    throw createError({
      statusCode: 400,
      message: "Mode de livraison requis",
    });
  }

  const deliveryAddress = body.deliveryAddress?.trim() || null;
  const deliveryCity = body.deliveryCity?.trim() || null;
  const deliveryPostalCode = body.deliveryPostalCode?.trim() || null;
  const firstRentalStart = rentalLines
    .map(line => line.rentalWindow?.startAt ?? null)
    .filter((value): value is Date => value instanceof Date)
    .sort((left, right) => left.getTime() - right.getTime())[0] ?? null;
  const rentalFulfillmentTime = firstRentalStart
    ? new Intl.DateTimeFormat("fr-FR", {
        timeZone: rentalCalendar.timezone,
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(firstRentalStart)
    : null;
  const fulfillment = getReservationFulfillment({
    deliveryType,
    pickupPoint,
    deliveryTour,
    onSitePickup,
    deliveryAddress,
    deliveryCity,
    deliveryPostalCode,
    fulfillmentDate: firstRentalStart,
    fulfillmentTime: rentalFulfillmentTime,
  });

  const baseOrderData = {
    userId: accountProvisioning.userId,
    language,
    status: resolveRentalOrderStatus({
      hasRental: rentalLines.length > 0,
      useStripe,
      requiresManualApproval: manualRentalApproval,
    }),
    paymentProvider: useStripe ? "STRIPE" : "OFFLINE",
    paymentStatus: useStripe ? "PENDING" : "UNPAID",
    customerName: body.customerName.trim(),
    email: normalizedEmail,
    phone: body.phone?.trim() || null,
    message: body.message?.trim() || null,
    deliveryType,
    pickupPointId,
    deliveryTourId,
    deliveryAddress,
    deliveryCity,
    deliveryPostalCode,
    fulfillmentDate: fulfillment.fulfillmentDate,
    fulfillmentTime: fulfillment.fulfillmentTime,
    fulfillmentLocation: fulfillment.fulfillmentLocation,
    rentalStartDate: orderRentalStartDate,
    rentalEndDate: orderRentalEndDate,
    currency: "eur",
    subtotal,
    total: subtotal,
    paidAt: null,
    refundedAt: null,
    checkoutUrl: null,
    providerSessionId: null,
    providerPaymentIntentId: null,
    providerPaymentStatus: null,
    providerLastEventId: null,
    paymentFailureReason: null,
  };

  let orderId: number;
  let orderNumber: string;

  if (retryOrder) {
    orderId = Number(retryOrder.id);
    orderNumber = String(retryOrder.orderNumber || createOrderNumber(orderId));
    await db.shopOrder.update({
      where: { id: orderId },
      data: {
        ...baseOrderData,
        orderNumber,
      },
    });
    await db.shopOrderLine.deleteMany({
      where: { orderId },
    });
  } else {
    const order = await db.shopOrder.create({
      data: {
        orderNumber: `TMP-${Date.now()}`,
        ...baseOrderData,
      },
    });
    orderId = Number(order.id);
    orderNumber = createOrderNumber(orderId);
    await db.shopOrder.update({
      where: { id: orderId },
      data: { orderNumber },
    });
  }

  await db.shopOrderLine.createMany({
    data: orderLines.map((line) => ({
      orderId,
      productId: line.productId,
      title: line.title,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      totalPrice: line.totalPrice,
      rentalStartDate: line.rentalWindow?.rentalStartDate ?? null,
      rentalEndDate: line.rentalWindow?.rentalEndDate ?? null,
      metaJson: JSON.stringify({
        ...safeParseMeta(line.metaJson),
        rentalStartDate: line.rentalWindow?.rentalStartDate ?? null,
        rentalEndDate: line.rentalWindow?.rentalEndDate ?? null,
      }),
    })),
  });

  const existingDeposit = await db.rentalDeposit.findUnique({ where: { orderId } })
  if (depositAmount > 0) {
    const depositData = {
      amount: depositAmount,
      paymentMode: depositPaymentMode,
      status: 'PENDING',
      providerSessionId: null,
      providerPaymentIntentId: null,
      providerPaymentStatus: null,
      failureReason: null,
      paidAt: null,
      releasedAt: null,
      retainedAmount: 0,
    }
    if (existingDeposit && depositAlreadyCollected) {
      // A payment retry must never reopen or recollect an already settled deposit.
    } else if (existingDeposit) {
      await db.rentalDeposit.update({ where: { id: existingDeposit.id }, data: depositData })
    } else {
      await db.rentalDeposit.create({ data: { orderId, ...depositData } })
    }
  } else if (existingDeposit) {
    await db.rentalDeposit.delete({ where: { id: existingDeposit.id } })
  }

  const allStockProductIds = new Set<number>([
    ...requiredStocks.keys(),
    ...previouslyReservedStocks.keys(),
  ]);
  for (const productId of allStockProductIds) {
    const source = productById.get(productId)
      || await db.product.findUnique({ where: { id: productId } });
    if (!source) continue;
    const requiredQuantity = requiredStocks.get(productId) || 0;
    const previouslyReservedQuantity = previouslyReservedStocks.get(productId) || 0;
    const stockDelta = requiredQuantity - previouslyReservedQuantity;
    if (!stockDelta) continue;
    await db.product.update({
      where: { id: productId },
      data: {
        stock: Math.max(0, source.stock - stockDelta),
      },
    });
    source.stock = Math.max(0, source.stock - stockDelta);
  }

  let checkoutUrl: string | null = null;
  let providerSessionId: string | null = null;
  let providerPaymentIntentId: string | null = null;

  const depositOnline = depositAmount > 0 && depositPaymentMode === 'ONLINE' && !depositAlreadyCollected
  if (useStripe || depositOnline) {
    const requestUrl = getRequestURL(event);
    const localePrefix = language === 'fr' ? '' : `/${language}`;
    const successUrl = `${requestUrl.origin}${localePrefix}/payment/success?order=${orderId}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${requestUrl.origin}${localePrefix}/panier?checkout=cancel&order=${orderId}&session_id={CHECKOUT_SESSION_ID}`;
    const session = await createStripeCheckoutSession({
      orderId: depositOnline && !useStripe ? getRentalDepositRegistryOrderId(orderId) : String(orderId),
      orderNumber,
      successUrl,
      cancelUrl,
      customerEmail: normalizedEmail,
      locale: language,
      metadata: {
        orderId: String(orderId),
        orderNumber,
        paymentPurpose: useStripe ? (depositOnline ? 'order_with_deposit' : 'order') : 'rental_deposit',
        depositAmount: depositOnline ? String(Math.round(depositAmount * 100)) : '0',
      },
      lineItems: [
        ...(useStripe ? orderLines.map((line) => ({
        name: line.title,
        amount: Math.round(line.unitPrice * 100),
        quantity: line.quantity,
        currency: "eur",
        description: line.description,
        imageUrl: toStripeCompatibleImageUrl(line.imageUrl, requestUrl.origin),
        taxBehavior: line.paymentTaxBehavior || undefined,
        taxCode: line.paymentTaxCode || undefined,
        })) : []),
        ...(depositOnline ? [{
          name: language === 'en' ? 'Refundable security deposit' : 'Dépôt de garantie remboursable',
          amount: Math.round(depositAmount * 100),
          quantity: 1,
          currency: 'eur',
          description: language === 'en' ? `Security deposit for ${orderNumber}` : `Dépôt de garantie lié à ${orderNumber}`,
          taxBehavior: 'inclusive' as const,
          taxCode: 'txcd_00000000',
        }] : []),
      ],
    });
    checkoutUrl = session.url;
    providerSessionId = session.id;
    providerPaymentIntentId = session.paymentIntentId;
    if (useStripe) {
      await db.shopOrder.update({
        where: { id: orderId },
        data: { checkoutUrl, providerSessionId, providerPaymentIntentId },
      });
    }
    if (depositOnline) {
      await db.rentalDeposit.update({
        where: { orderId },
        data: { providerSessionId, providerPaymentIntentId, providerPaymentStatus: session.status },
      })
    }
  }

  const fullOrder = await db.shopOrder.findUnique({
    where: { id: orderId },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  });

  await sendShopOrderCreatedNotifications(orderId, {
    notifyAdmin: !useStripe,
  });

  return {
    ok: true,
    redirectUrl: checkoutUrl,
    accountProvisioning: accountProvisioningFeedback,
    order: serializeShopOrder(fullOrder),
  };
});

async function resolveOrderAccountProvisioning(options: {
  sessionUserId: number | null;
  email: string;
  customerName: string;
  locale: string;
}) {
  if (options.sessionUserId) {
    return {
      userId: options.sessionUserId,
      invitationSent: false,
      linkedToExistingAccount: true,
      createdInvitedAccount: false,
    };
  }

  const existingUser = await db.user.findUnique({
    where: { email: options.email },
    select: {
      id: true,
      email: true,
      isActive: true,
      firstName: true,
      lastName: true,
    },
  });

  if (existingUser?.isActive) {
    return {
      userId: existingUser.id,
      invitationSent: false,
      linkedToExistingAccount: true,
      createdInvitedAccount: false,
    };
  }

  if (existingUser) {
    const { token: setupToken, expiresAt } =
      await authService.createPasswordSetupToken(existingUser.id);
    const invitationSent = await trySendOrderInvitationEmail({
      email: existingUser.email,
      firstName: existingUser.firstName ?? extractNameParts(options.customerName).firstName,
      lastName: existingUser.lastName ?? extractNameParts(options.customerName).lastName,
      setupToken,
      expiresAt,
      locale: options.locale,
    });
    return {
      userId: existingUser.id,
      invitationSent,
      linkedToExistingAccount: true,
      createdInvitedAccount: false,
    };
  }

  const defaultRole =
    (await db.role.findFirst({
      where: { isDefault: true },
      orderBy: { id: "asc" },
      select: { slug: true },
    }))?.slug || "utilisateur_public";
  const nameParts = extractNameParts(options.customerName);
  const invited = await authService.createInvitedUser(
    options.email,
    nameParts.firstName,
    nameParts.lastName,
    undefined,
    defaultRole,
  );

  const invitationSent = await trySendOrderInvitationEmail({
    email: options.email,
    firstName: nameParts.firstName,
    lastName: nameParts.lastName,
    setupToken: invited.setupToken,
    expiresAt: invited.expiresAt,
    locale: options.locale,
  });

  return {
    userId: invited.user.id,
    invitationSent,
    linkedToExistingAccount: false,
    createdInvitedAccount: true,
  };
}

function buildProductOptionLines(line: any, language: string) {
  const requested = new Map<string, number>()
  for (const selection of line.requestedOptionSelections || []) {
    const optionId = String(selection?.optionId || '').trim()
    const quantity = Number(selection?.quantity)
    if (!optionId || requested.has(optionId) || !Number.isInteger(quantity) || quantity <= 0) {
      throw createError({ statusCode: 400, message: 'Sélection d’option invalide' })
    }
    requested.set(optionId, quantity)
  }

  const availableOptions = new Map<string, ProductOption>()
  for (const group of line.product.optionGroups) {
    const options = group.options.filter((option: ProductOption) => option.active)
    for (const option of options) availableOptions.set(option.id, option)
    const selectedCount = options.filter((option: ProductOption) => requested.has(option.id)).length
    const minimum = group.required ? Math.max(1, group.minSelections) : group.minSelections
    if (selectedCount < minimum || (group.maxSelections != null && selectedCount > group.maxSelections)) {
      throw createError({ statusCode: 400, message: `Le groupe d’options « ${pickProductLocalizedText(language, group.titleLocalized, group.title)} » est incomplet` })
    }
  }
  for (const optionId of requested.keys()) {
    if (!availableOptions.has(optionId)) {
      throw createError({ statusCode: 400, message: 'Une option sélectionnée n’est pas disponible pour ce produit' })
    }
  }

  return Array.from(requested.entries()).map(([optionId, requestedQuantity]) => {
    const option = availableOptions.get(optionId)!
    const minimum = Math.max(1, option.minQuantity)
    const maximum = option.maxQuantity ?? Number.MAX_SAFE_INTEGER
    if (requestedQuantity < minimum || requestedQuantity > maximum) {
      throw createError({ statusCode: 400, message: `Quantité invalide pour ${pickProductLocalizedText(language, option.labelLocalized, option.label)}` })
    }
    if (!option.quantityEditable && requestedQuantity !== Math.max(1, option.defaultQuantity)) {
      throw createError({ statusCode: 400, message: 'La quantité de cette option ne peut pas être modifiée' })
    }
    const linkedProduct = option.linkedProduct
    if (option.kind === 'ACCESSORY' && option.linkedProductId && (!linkedProduct || !linkedProduct.active)) {
      throw createError({ statusCode: 409, message: 'Cet accessoire n’est plus disponible' })
    }
    const quantity = getProductOptionChargedQuantity(option.quantityMode, line.quantity, requestedQuantity)
    if (linkedProduct && quantity > linkedProduct.stock) {
      throw createError({ statusCode: 409, message: `Stock insuffisant pour ${linkedProduct.name}` })
    }
    if (linkedProduct?.saleType === 'RENTAL' && !line.rentalWindow) {
      throw createError({ statusCode: 400, message: 'Un accessoire loué nécessite une période de location' })
    }
    const unitPrice = getProductOptionCalculatedUnitPrice(
      option,
      Number(line.rentalDurationUnits || 0),
      line.rentalPricingMode,
    )
    const vatRate = option.vatRate == null ? line.vatRate : option.vatRate
    const title = pickProductLocalizedText(language, option.labelLocalized, option.label)
      || linkedProduct?.name
      || 'Option'
    const isRentalAccessory = linkedProduct?.saleType === 'RENTAL'

    return {
      kind: 'option' as const,
      quantity,
      title,
      productId: linkedProduct?.id ?? null,
      unitPrice,
      totalPrice: unitPrice * quantity,
      vatRate,
      stock: linkedProduct?.stock ?? Number.MAX_SAFE_INTEGER,
      allowOfflinePayment: linkedProduct?.allowOfflinePayment ?? line.allowOfflinePayment,
      allowOnlinePayment: linkedProduct?.allowOnlinePayment ?? line.allowOnlinePayment,
      saleType: isRentalAccessory ? 'RENTAL' as const : linkedProduct ? 'SALE' as const : 'OPTION' as const,
      imageUrl: null,
      description: pickProductLocalizedText(language, option.descriptionLocalized, option.description) || undefined,
      paymentTaxCode: linkedProduct?.paymentTaxCode ?? line.paymentTaxCode,
      paymentTaxBehavior: linkedProduct?.paymentTaxBehavior ?? line.paymentTaxBehavior,
      rentalAvailableFrom: linkedProduct?.rentalAvailableFrom ?? null,
      rentalAvailableTo: linkedProduct?.rentalAvailableTo ?? null,
      rentalMinDays: linkedProduct?.rentalMinDays ?? 1,
      rentalMaxDays: linkedProduct?.rentalMaxDays ?? null,
      rentalBookingMode: linkedProduct?.rentalBookingMode ?? 'MULTI_DAY',
      rentalApprovalMode: linkedProduct?.rentalApprovalMode ?? 'AUTO',
      rentalDurations: linkedProduct?.rentalDurations ?? [],
      rentalSlotStepMinutes: linkedProduct?.rentalSlotStepMinutes ?? 30,
      rentalDepositAmount: isRentalAccessory ? linkedProduct?.rentalDepositAmount ?? null : null,
      rentalDepositAllowOnsitePayment: linkedProduct?.rentalDepositAllowOnsitePayment ?? true,
      rentalDepositAllowOnlinePayment: linkedProduct?.rentalDepositAllowOnlinePayment ?? false,
      rentalPricingMode: isRentalAccessory ? line.rentalPricingMode : null,
      rentalWindow: isRentalAccessory ? line.rentalWindow : null,
      metaJson: JSON.stringify({
        lineKind: option.kind,
        optionId,
        relatedProductId: line.productId,
        billingDocumentId: option.billingDocumentId,
        rentalPricingMode: line.rentalPricingMode,
        rentalDurationUnits: line.rentalDurationUnits,
        vatRate,
        linkedBillingDocuments: option.billingDocumentId
          ? [{ id: option.billingDocumentId, name: option.billingDocument?.name, kind: option.billingDocument?.kind }]
          : [],
      }),
    }
  })
}

function extractNameParts(customerName: string) {
  const parts = customerName
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return {
    firstName: parts[0] || undefined,
    lastName: parts.slice(1).join(" ") || undefined,
  };
}

async function trySendOrderInvitationEmail(options: {
  email: string;
  firstName?: string;
  lastName?: string;
  setupToken: string;
  expiresAt: Date;
  locale: string;
}) {
  try {
    await sendUserInvitationEmail(options);
    return true;
  } catch (error) {
    console.error("Unable to send guest account invitation email:", error);
    return false;
  }
}

function safeParseMeta(value: string) {
  try {
    return JSON.parse(value) as Record<string, any>;
  } catch {
    return {};
  }
}

function interpolate(template: string, params: Record<string, string | number>) {
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, key) => String(params[key] ?? ''))
}

function resolveRentalPricingMode(
  bookingMode: 'SINGLE_DAY' | 'MULTI_DAY' | 'BOTH',
  window: NonNullable<ReturnType<typeof resolveRentalWindow>>,
  requested: OrderLineInput['rentalPricingMode'],
) {
  const resolved = bookingMode === 'SINGLE_DAY' ? 'HOURLY' : bookingMode === 'MULTI_DAY' ? 'DAILY' : requested
  if (resolved !== 'HOURLY' && resolved !== 'DAILY') {
    throw createError({ statusCode: 400, message: 'Le mode de tarification de la location est requis' })
  }
  if (resolved === 'HOURLY' && !isHourlyRentalWindow('BOTH', window)) {
    throw createError({ statusCode: 400, message: 'Le créneau ne correspond pas au mode de tarification choisi' })
  }
  return resolved
}

function calculateRentalPrice(
  product: ReturnType<typeof serializeProduct>,
  window: NonNullable<ReturnType<typeof resolveRentalWindow>>,
  pricingMode: 'HOURLY' | 'DAILY',
) {
  const exactRate = resolveRentalRatePrice(product.rentalRates, pricingMode, pricingMode === 'HOURLY'
    ? (window.endAt.getTime() - window.startAt.getTime()) / 3600000
    : window.durationDays)
  if (product.rentalPricingStrategy === 'GRID') {
    if (exactRate == null) {
      throw createError({ statusCode: 400, message: 'Aucun tarif n’est configuré pour cette durée de location' })
    }
    return exactRate
  }
  if (pricingMode === 'HOURLY') {
    const hourlyPrice = product.rentalHourlyPrice ?? (product.rentalBookingMode === 'SINGLE_DAY' ? product.price : null)
    if (hourlyPrice == null) throw createError({ statusCode: 400, message: 'Tarif horaire indisponible' })
    const hours = (window.endAt.getTime() - window.startAt.getTime()) / 3600000
    return Math.round(Number(hourlyPrice) * hours * 100) / 100
  }
  const dailyPrice = product.rentalDailyPrice ?? (product.rentalBookingMode === 'MULTI_DAY' ? product.price : null)
  if (dailyPrice == null) throw createError({ statusCode: 400, message: 'Tarif journalier indisponible' })
  return Math.round(Number(dailyPrice) * window.durationDays * 100) / 100
}

function getRentalDurationUnits(
  window: NonNullable<ReturnType<typeof resolveRentalWindow>>,
  pricingMode: 'HOURLY' | 'DAILY',
) {
  return pricingMode === 'HOURLY'
    ? Math.max(0, (window.endAt.getTime() - window.startAt.getTime()) / 3600000)
    : Math.max(1, window.durationDays)
}

function calculateRentalInsurancePrice<T extends {
  mediaDocumentRentalHourlyPrice: number | null
  mediaDocumentRentalDailyPrice: number | null
}>(document: T, durationUnits: number, pricingMode: 'HOURLY' | 'DAILY') {
  const rate = pricingMode === 'HOURLY'
    ? document.mediaDocumentRentalHourlyPrice
    : document.mediaDocumentRentalDailyPrice
  return Math.round(Number(rate || 0) * durationUnits * 100) / 100
}

function uniqueBillingDocumentItems<T extends { mediaDocumentId: number | null }>(items: T[]) {
  const unique = new Map<number, T>()
  for (const item of items) {
    const id = Number(item.mediaDocumentId || 0)
    if (id > 0 && !unique.has(id)) unique.set(id, item)
  }
  return Array.from(unique.values())
}

function toStripeCompatibleImageUrl(
  value: string | null | undefined,
  origin: string,
) {
  if (!value?.trim()) return undefined;

  try {
    const resolved = new URL(value, origin);
    if (!["http:", "https:"].includes(resolved.protocol)) {
      return undefined;
    }

    const hostname = resolved.hostname.toLowerCase();
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local")
    ) {
      return undefined;
    }

    return resolved.toString();
  } catch {
    return undefined;
  }
}
