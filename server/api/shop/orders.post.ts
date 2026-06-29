import { db } from "#modula/server/data/client";
import { AuthService } from "#modula/server/services/auth/authService";
import { sendUserInvitationEmail } from "#modula/server/services/auth/userInvitation";
import {
  createStripeCheckoutSession,
  isStripeConfigured,
} from "#modula/server/services/payment/paymentService";
import { sendShopOrderCreatedNotifications } from "#modula/server/services/shop/shopOrderEmails";
import { getReservationFulfillment } from "#modula/server/utils/orderFulfillment";
import {
  getOnSitePickupConfig,
} from "#modula/server/utils/settings";
import {
  createOrderNumber,
  pickProductLocalizedText,
  serializeProduct,
  serializeShopOrder,
} from "#modula/server/utils/shop";
import {
  ensureRentalAvailability,
  resolveRentalWindow,
} from "#modula/server/services/shop/rentalAvailability";

interface OrderLineInput {
  kind: "product";
  productId?: number;
  quantity?: number;
  saleType?: "SALE" | "RENTAL";
  rentalStartDate?: string | null;
  rentalEndDate?: string | null;
}

interface OrderBody {
  customerName: string;
  email: string;
  language?: string | null;
  phone?: string | null;
  message?: string | null;
  paymentMode?: "offline" | "stripe";
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
  const normalizedEmail = body.email.trim().toLowerCase();

  if (!body.customerName?.trim() || !body.email?.trim()) {
    throw createError({
      statusCode: 400,
      statusMessage: "Informations client incomplètes",
    });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw createError({ statusCode: 400, statusMessage: "Email invalide" });
  }

  const lines = Array.isArray(body.lines) ? body.lines : [];
  if (!lines.length) {
    throw createError({ statusCode: 400, statusMessage: "Panier vide" });
  }

  const productIds = Array.from(
    new Set(
      lines
        .filter((line) => line.kind === "product" && Number(line.productId) > 0)
        .map((line) => Number(line.productId)),
    ),
  );

  const directProducts = productIds.length
    ? await db.product.findMany({ where: { id: { in: productIds }, active: true } })
    : [];

  const productMapSource = new Map<
    number,
    ReturnType<typeof serializeProduct>
  >();

  for (const row of directProducts) {
    const serialized = serializeProduct(row);
    productMapSource.set(serialized.id, serialized);
  }

  const productById = productMapSource;

  const normalizedLines = lines.map((line) => {
    const quantity = Math.max(1, Math.round(Number(line.quantity || 1)));
    const product = productById.get(Number(line.productId));
    if (!product) {
      throw createError({
        statusCode: 400,
        statusMessage: "Produit introuvable dans le panier",
      });
    }

    return {
      kind: "product" as const,
      quantity,
      title: pickProductLocalizedText(language, product.nameLocalized, product.name),
      productId: product.id,
      productLotId: null,
      unitPrice: product.price,
      totalPrice: product.price * quantity,
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
        vatRate: product.vatRate,
        paymentTaxCode: product.paymentTaxCode,
        paymentTaxBehavior: product.paymentTaxBehavior,
      }),
      paymentTaxCode: product.paymentTaxCode,
      paymentTaxBehavior: product.paymentTaxBehavior,
      rentalAvailableFrom: product.rentalAvailableFrom,
      rentalAvailableTo: product.rentalAvailableTo,
      rentalMinDays: product.rentalMinDays,
      rentalMaxDays: product.rentalMaxDays,
      rentalWindow:
        product.saleType === "RENTAL"
          ? resolveRentalWindow(line.rentalStartDate, line.rentalEndDate)
          : null,
    };
  });

  const rentalLines = normalizedLines.filter((line) => line.saleType === "RENTAL");

  if (rentalLines.length) {
    await ensureRentalAvailability(
      rentalLines.map((line) => ({
        kind: line.kind,
        id: line.productId ?? 0,
        title: line.title,
        quantity: line.quantity,
        stock: line.stock,
        rentalAvailableFrom: line.rentalAvailableFrom,
        rentalAvailableTo: line.rentalAvailableTo,
        rentalMinDays: line.rentalMinDays,
        rentalMaxDays: line.rentalMaxDays,
        rentalWindow: line.rentalWindow,
      })),
    );
  }

  const allowOffline = normalizedLines.every(
    (line) => line.allowOfflinePayment,
  );
  const stripeConfigured = await isStripeConfigured();
  const allowOnline =
    stripeConfigured &&
    normalizedLines.every((line) => line.allowOnlinePayment);
  const paymentMode =
    body.paymentMode === "stripe"
      ? "stripe"
      : body.paymentMode === "offline"
        ? "offline"
        : allowOnline && !allowOffline
          ? "stripe"
          : "offline";

  if (!allowOffline && !allowOnline) {
    throw createError({
      statusCode: 400,
      statusMessage: "Aucun mode de paiement compatible pour ce panier",
    });
  }
  if (paymentMode === "stripe" && !allowOnline) {
    throw createError({
      statusCode: 400,
      statusMessage: "Le paiement en ligne n’est pas disponible pour ce panier",
    });
  }
  if (paymentMode === "offline" && !allowOffline) {
    throw createError({
      statusCode: 400,
      statusMessage: "Le paiement sur place n’est pas disponible pour ce panier",
    });
  }

  const requiredStocks = new Map<number, number>();
  for (const line of normalizedLines) {
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
    const product = productById.get(productId);
    if (!product || product.stock < requiredQuantity) {
      throw createError({
        statusCode: 400,
        statusMessage: `Stock insuffisant pour ${product?.name || `#${productId}`}`,
      });
    }
  }

  const subtotal = normalizedLines.reduce(
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

  if (body.deliveryType === "ONSITE") {
    deliveryType = "ONSITE";
  } else if (body.deliveryType === "PICKUP") {
    if (!body.pickupPointId) {
      throw createError({
        statusCode: 400,
        statusMessage: "Point relais requis",
      });
    }

    const row = await db.pickupPoint.findUnique({
      where: { id: Number(body.pickupPointId) },
      select: {
        id: true,
        active: true,
        name: true,
        address: true,
        deliveryDay: true,
        pickupStartTime: true,
      },
    });

    if (!row || !row.active) {
      throw createError({
        statusCode: 400,
        statusMessage: "Point relais invalide",
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
        statusMessage: "Livraison requise",
      });
    }
    if (!body.deliveryCity?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Ville requise pour la livraison",
      });
    }
    if (!body.deliveryAddress?.trim()) {
      throw createError({
        statusCode: 400,
        statusMessage: "Adresse requise pour la livraison",
      });
    }

    const row = await db.deliveryTour.findUnique({
      where: { id: Number(body.deliveryTourId) },
      select: {
        id: true,
        active: true,
        name: true,
        dayOfWeek: true,
        startTime: true,
        endTime: true,
      },
    });

    if (!row || !row.active) {
      throw createError({
        statusCode: 400,
        statusMessage: "Créneau de livraison invalide",
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
        statusMessage:
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
      statusMessage: "Mode de livraison requis",
    });
  }

  const deliveryAddress = body.deliveryAddress?.trim() || null;
  const deliveryCity = body.deliveryCity?.trim() || null;
  const deliveryPostalCode = body.deliveryPostalCode?.trim() || null;
  const fulfillment = getReservationFulfillment({
    deliveryType,
    pickupPoint,
    deliveryTour,
    onSitePickup,
    deliveryAddress,
    deliveryCity,
    deliveryPostalCode,
  });

  const order = await db.shopOrder.create({
    data: {
      orderNumber: `TMP-${Date.now()}`,
      userId: accountProvisioning.userId,
      language,
      status: "PENDING",
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
    },
  });

  const orderNumber = createOrderNumber(Number(order.id));
  await db.shopOrder.update({
    where: { id: order.id },
    data: { orderNumber },
  });

  await db.shopOrderLine.createMany({
    data: normalizedLines.map((line) => ({
      orderId: order.id,
      productLotId: line.productLotId,
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

  for (const [productId, requiredQuantity] of requiredStocks.entries()) {
    const source = productById.get(productId);
    if (!source) continue;
    await db.product.update({
      where: { id: productId },
      data: {
        stock: Math.max(0, source.stock - requiredQuantity),
      },
    });
    source.stock = Math.max(0, source.stock - requiredQuantity);
  }

  let checkoutUrl: string | null = null;
  let providerSessionId: string | null = null;
  let providerPaymentIntentId: string | null = null;

  if (useStripe) {
    const requestUrl = getRequestURL(event);
    const localePrefix = language === 'fr' ? '' : `/${language}`;
    const successUrl = `${requestUrl.origin}${localePrefix}/payment/success?order=${order.id}&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${requestUrl.origin}${localePrefix}/panier?checkout=cancel&order=${order.id}`;
    const session = await createStripeCheckoutSession({
      orderId: String(order.id),
      orderNumber,
      successUrl,
      cancelUrl,
      customerEmail: normalizedEmail,
      locale: language,
      metadata: {
        orderId: String(order.id),
        orderNumber,
      },
      lineItems: normalizedLines.map((line) => ({
        name: line.title,
        amount: Math.round(line.unitPrice * 100),
        quantity: line.quantity,
        currency: "eur",
        description: line.description,
        imageUrl: toStripeCompatibleImageUrl(line.imageUrl, requestUrl.origin),
        taxBehavior: line.paymentTaxBehavior || undefined,
        taxCode: line.paymentTaxCode || undefined,
      })),
    });
    checkoutUrl = session.url;
    providerSessionId = session.id;
    providerPaymentIntentId = session.paymentIntentId;
    await db.shopOrder.update({
      where: { id: order.id },
      data: {
        checkoutUrl,
        providerSessionId,
        providerPaymentIntentId,
      },
    });
  }

  const fullOrder = await db.shopOrder.findUnique({
    where: { id: order.id },
    include: {
      lines: true,
      pickupPoint: true,
      deliveryTour: true,
    },
  });

  await sendShopOrderCreatedNotifications(order.id, {
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
  locale: "fr" | "en";
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
  locale: "fr" | "en";
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
