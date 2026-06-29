import { defineModel, defineSchema, field, index, relation, unique } from './dsl.ts'

const vegetableUnits = ['KG', 'PIECE']
const reservationStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED']
const reservationOccurrenceStatuses = ['SCHEDULED', 'CANCELLED']
const deliveryTypes = ['ONSITE', 'PICKUP', 'TOUR']
const reservationScheduleProposalSources = ['CUSTOMER', 'ADMIN']
const productLotKinds = ['SINGLE', 'LOT']
const productSaleTypes = ['SALE', 'RENTAL']
const billingDocumentKinds = ['INVOICE', 'CONTRACT', 'ASSURANCE']
const shopOrderStatuses = ['DRAFT', 'PENDING', 'PAID', 'CANCELLED']
const shopPaymentProviders = ['OFFLINE', 'STRIPE']
const shopPaymentStatuses = ['UNPAID', 'PENDING', 'PAID', 'FAILED', 'REFUNDED']
const stripeTaxBehaviors = ['inclusive', 'exclusive']
const eventStatuses = ['DRAFT', 'PUBLISHED', 'ARCHIVED', 'CANCELLED']
const eventVisibilities = ['PUBLIC', 'PRIVATE']
const eventApprovalModes = ['AUTO', 'MANUAL']
const eventPublicReservationStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED']
const eventInternalParticipationStatuses = ['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED']
const eventKinds = ['EVENT', 'PERMANENCE']
const eventRecurrenceTypes = ['NONE', 'WEEKLY']
const eventOccurrenceStatuses = ['SCHEDULED', 'CANCELLED']
const cmsPageTypes = ['CMS', 'APPLICATION', 'HYBRID']
const cmsPageStatuses = ['DRAFT', 'PUBLISHED']
const cmsApplicationPositions = ['BEFORE_CONTENT', 'AFTER_CONTENT']
const cmsNavigationMenus = ['PRIMARY', 'FOOTER']
const cmsNavigationItemTypes = ['CMS_PAGE', 'APPLICATION_ROUTE', 'EXTERNAL_URL']

export const cmsDataSchema = defineSchema({
  models: {
    SiteParams: defineModel({
      tableName: 'SiteParams',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        key: field.string({ unique: true }),
        value: field.string(),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      indexes: [
        unique(['key'], 'SiteParams_key_key')
      ]
    }),
    User: defineModel({
      tableName: 'User',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        email: field.string({ unique: true }),
        password: field.string(),
        firstName: field.string({ nullable: true }),
        lastName: field.string({ nullable: true }),
        birthDate: field.datetime({ nullable: true }),
        role: field.string({ default: 'user' }),
        isActive: field.boolean({ default: true }),
        roleId: field.int({ nullable: true }),
        street: field.string({ nullable: true }),
        city: field.string({ nullable: true }),
        postalCode: field.string({ nullable: true }),
        country: field.string({ nullable: true, default: 'France' }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        managedRole: relation.belongsTo('Role', 'roleId', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        unique(['email'], 'User_email_key'),
        index(['roleId'], 'User_roleId_idx'),
        index(['isActive'], 'User_isActive_idx')
      ]
    }),
    PasswordSetupToken: defineModel({
      tableName: 'PasswordSetupToken',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        token: field.string({ unique: true }),
        userId: field.int(),
        expiresAt: field.datetime(),
        usedAt: field.datetime({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        user: relation.belongsTo('User', 'userId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        unique(['token'], 'PasswordSetupToken_token_key'),
        index(['userId'], 'PasswordSetupToken_userId_idx'),
        index(['expiresAt'], 'PasswordSetupToken_expiresAt_idx')
      ]
    }),
    Role: defineModel({
      tableName: 'Role',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        slug: field.string({ unique: true }),
        name: field.string(),
        description: field.string({ nullable: true }),
        isSystem: field.boolean({ default: false }),
        isDefault: field.boolean({ default: false }),
        specialPermissionsJson: field.string({ default: '[]' }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      indexes: [
        unique(['slug'], 'Role_slug_key')
      ]
    }),
    RolePermission: defineModel({
      tableName: 'RolePermission',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        roleId: field.int(),
        module: field.string(),
        canRead: field.boolean({ default: false }),
        canCreate: field.boolean({ default: false }),
        canUpdate: field.boolean({ default: false }),
        canDelete: field.boolean({ default: false }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        role: relation.belongsTo('Role', 'roleId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        unique(['roleId', 'module'], 'RolePermission_roleId_module_key'),
        index(['module'], 'RolePermission_module_idx')
      ]
    }),
    MemberRole: defineModel({
      tableName: 'MemberRole',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        slug: field.string({ unique: true }),
        name: field.string(),
        description: field.string({ nullable: true }),
        color: field.string({ nullable: true }),
        isSystem: field.boolean({ default: false }),
        isDefault: field.boolean({ default: false }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      indexes: [
        unique(['slug'], 'MemberRole_slug_key')
      ]
    }),
    UserMemberRole: defineModel({
      tableName: 'UserMemberRole',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        userId: field.int(),
        memberRoleId: field.int(),
        createdAt: field.datetime({ default: 'now' })
      },
      relations: {
        user: relation.belongsTo('User', 'userId', 'id', { onDelete: 'cascade' }),
        memberRole: relation.belongsTo('MemberRole', 'memberRoleId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        unique(['userId', 'memberRoleId'], 'UserMemberRole_userId_memberRoleId_key'),
        index(['memberRoleId'], 'UserMemberRole_memberRoleId_idx')
      ]
    }),
    Vegetable: defineModel({
      tableName: 'Vegetable',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        name: field.string({ unique: true }),
        unit: field.enum(vegetableUnits, { default: 'KG' }),
        price: field.decimal(),
        imageUrl: field.string({ nullable: true }),
        active: field.boolean({ default: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      indexes: [
        unique(['name'], 'Vegetable_name_key')
      ]
    }),
    Basket: defineModel({
      tableName: 'Basket',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        name: field.string(),
        description: field.string({ nullable: true }),
        imageUrl: field.string({ nullable: true }),
        computedPrice: field.decimal({ default: 0 }),
        finalPrice: field.decimal({ default: 0 }),
        available: field.int({ default: 0 }),
        active: field.boolean({ default: true }),
        position: field.int({ default: 0 }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      }
    }),
    BasketItem: defineModel({
      tableName: 'BasketItem',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        basketId: field.int(),
        vegetableId: field.int(),
        quantity: field.decimal()
      },
      relations: {
        basket: relation.belongsTo('Basket', 'basketId', 'id', { onDelete: 'cascade' }),
        vegetable: relation.belongsTo('Vegetable', 'vegetableId', 'id', { onDelete: 'restrict' })
      },
      indexes: [
        unique(['basketId', 'vegetableId'], 'BasketItem_basketId_vegetableId_key'),
        index(['basketId'], 'BasketItem_basketId_idx'),
        index(['vegetableId'], 'BasketItem_vegetableId_idx')
      ]
    }),
    Reservation: defineModel({
      tableName: 'Reservation',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        basketId: field.int(),
        userId: field.int({ nullable: true }),
        customerName: field.string(),
        email: field.string(),
        language: field.string({ default: 'fr' }),
        phone: field.string({ nullable: true }),
        message: field.string({ nullable: true }),
        status: field.enum(reservationStatuses, { default: 'PENDING' }),
        adminNote: field.string({ nullable: true }),
        confirmedAt: field.datetime({ nullable: true }),
        deliveryType: field.enum(deliveryTypes, { nullable: true }),
        pickupPointId: field.int({ nullable: true }),
        deliveryTourId: field.int({ nullable: true }),
        deliveryAddress: field.string({ nullable: true }),
        deliveryCity: field.string({ nullable: true }),
        deliveryPostalCode: field.string({ nullable: true }),
        fulfillmentDate: field.datetime({ nullable: true }),
        fulfillmentTime: field.string({ nullable: true }),
        fulfillmentLocation: field.string({ nullable: true }),
        monthlySubscription: field.boolean({ default: false }),
        googleCalendarEventId: field.string({ nullable: true }),
        googleCalendarSyncedAt: field.datetime({ nullable: true }),
        publicActionToken: field.string({ nullable: true, unique: true }),
        cancelledByCustomerAt: field.datetime({ nullable: true }),
        subscriptionActive: field.boolean({ default: true }),
        subscriptionCancelledAt: field.datetime({ nullable: true }),
        archivedAt: field.datetime({ nullable: true }),
        scheduleProposalPendingBy: field.enum(reservationScheduleProposalSources, { nullable: true }),
        lastScheduleProposalAt: field.datetime({ nullable: true }),
        scheduleProposalAcceptedAt: field.datetime({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        basket: relation.belongsTo('Basket', 'basketId', 'id', { onDelete: 'restrict' }),
        user: relation.belongsTo('User', 'userId', 'id', { onDelete: 'setNull' }),
        pickupPoint: relation.belongsTo('PickupPoint', 'pickupPointId', 'id', { onDelete: 'setNull' }),
        deliveryTour: relation.belongsTo('DeliveryTour', 'deliveryTourId', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        unique(['publicActionToken'], 'Reservation_publicActionToken_key'),
        index(['basketId'], 'Reservation_basketId_idx'),
        index(['userId'], 'Reservation_userId_idx'),
        index(['status'], 'Reservation_status_idx'),
        index(['archivedAt'], 'Reservation_archivedAt_idx'),
        index(['pickupPointId'], 'Reservation_pickupPointId_idx'),
        index(['deliveryTourId'], 'Reservation_deliveryTourId_idx')
      ]
    }),
    ReservationScheduleProposal: defineModel({
      tableName: 'ReservationScheduleProposal',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        reservationId: field.int(),
        proposedBy: field.enum(reservationScheduleProposalSources),
        proposalDate: field.datetime(),
        proposalTime: field.string(),
        proposalLocation: field.string({ nullable: true }),
        acceptedAt: field.datetime({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        reservation: relation.belongsTo('Reservation', 'reservationId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        unique(['reservationId', 'proposalDate', 'proposalTime'], 'ScheduleProposal_unique_date_time'),
        index(['reservationId', 'createdAt'], 'ReservationScheduleProposal_reservationId_createdAt_idx')
      ]
    }),
    ReservationOccurrence: defineModel({
      tableName: 'ReservationOccurrence',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        reservationId: field.int(),
        occurrenceDate: field.datetime(),
        originalOccurrenceDate: field.datetime({ nullable: true }),
        occurrenceTime: field.string({ nullable: true }),
        occurrenceLocation: field.string({ nullable: true }),
        status: field.enum(reservationOccurrenceStatuses, { default: 'SCHEDULED' }),
        customSchedule: field.boolean({ default: false }),
        cancelledAt: field.datetime({ nullable: true }),
        cancellationReason: field.string({ nullable: true }),
        googleCalendarEventId: field.string({ nullable: true }),
        lastNotifiedAt: field.datetime({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        reservation: relation.belongsTo('Reservation', 'reservationId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        index(['reservationId', 'occurrenceDate'], 'ReservationOccurrence_reservationId_occurrenceDate_idx')
      ]
    }),
    ReservationNotification: defineModel({
      tableName: 'ReservationNotification',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        reservationId: field.int(),
        occurrenceId: field.int({ nullable: true }),
        kind: field.string(),
        channel: field.string({ default: 'EMAIL' }),
        recipientEmail: field.string(),
        subject: field.string(),
        summary: field.string({ nullable: true }),
        createdAt: field.datetime({ default: 'now' })
      },
      relations: {
        reservation: relation.belongsTo('Reservation', 'reservationId', 'id', { onDelete: 'cascade' }),
        occurrence: relation.belongsTo('ReservationOccurrence', 'occurrenceId', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        index(['reservationId', 'createdAt'], 'ReservationNotification_reservationId_createdAt_idx'),
        index(['occurrenceId'], 'ReservationNotification_occurrenceId_idx')
      ]
    }),
    PickupPoint: defineModel({
      tableName: 'PickupPoint',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        name: field.string(),
        address: field.string({ nullable: true }),
        details: field.string({ nullable: true }),
        delayDays: field.int({ default: 0 }),
        deliveryDay: field.int({ nullable: true }),
        pickupStartTime: field.string({ nullable: true }),
        openingHours: field.string({ nullable: true }),
        websiteUrl: field.string({ nullable: true }),
        active: field.boolean({ default: true }),
        position: field.int({ default: 0 }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      }
    }),
    DeliveryTour: defineModel({
      tableName: 'DeliveryTour',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        name: field.string(),
        dayOfWeek: field.int(),
        startTime: field.string(),
        endTime: field.string(),
        monthlyPrice: field.decimal({ nullable: true }),
        notes: field.string({ nullable: true }),
        active: field.boolean({ default: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      }
    }),
    TourCity: defineModel({
      tableName: 'TourCity',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        tourId: field.int(),
        city: field.string(),
        postalCodes: field.string({ nullable: true }),
        createdAt: field.datetime({ default: 'now' })
      },
      relations: {
        tour: relation.belongsTo('DeliveryTour', 'tourId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        index(['tourId'], 'TourCity_tourId_idx')
      ]
    }),
    Product: defineModel({
      tableName: 'Product',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        name: field.string(),
        nameJson: field.string({ default: '{"fr":"","en":""}' }),
        slug: field.string({ unique: true }),
        saleType: field.enum(productSaleTypes, { default: 'SALE' }),
        categoryId: field.int({ nullable: true }),
        excerpt: field.string({ nullable: true }),
        excerptJson: field.string({ default: '{"fr":"","en":""}' }),
        description: field.string({ nullable: true }),
        descriptionJson: field.string({ default: '{"fr":"","en":""}' }),
        detailsJson: field.string({ default: '[]' }),
        imageUrl: field.string({ nullable: true }),
        price: field.decimal({ default: 0 }),
        vatRate: field.decimal({ default: 20 }),
        paymentTaxCode: field.string({ nullable: true }),
        paymentTaxBehavior: field.enum(stripeTaxBehaviors, { nullable: true }),
        stock: field.int({ default: 0 }),
        rentalAvailableFrom: field.datetime({ nullable: true }),
        rentalAvailableTo: field.datetime({ nullable: true }),
        rentalMinDays: field.int({ default: 1 }),
        rentalMaxDays: field.int({ nullable: true }),
        unitLabel: field.string({ nullable: true }),
        unitLabelJson: field.string({ default: '{"fr":"","en":""}' }),
        allowOfflinePayment: field.boolean({ default: true }),
        allowOnlinePayment: field.boolean({ default: false }),
        active: field.boolean({ default: true }),
        position: field.int({ default: 0 }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        category: relation.belongsTo('ProductCategory', 'categoryId', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        unique(['slug'], 'Product_slug_key'),
        index(['categoryId'], 'Product_categoryId_idx'),
        index(['saleType'], 'Product_saleType_idx'),
        index(['active', 'position'], 'Product_active_position_idx')
      ]
    }),
    ProductCategory: defineModel({
      tableName: 'ProductCategory',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        name: field.string(),
        slug: field.string({ unique: true }),
        description: field.string({ nullable: true }),
        position: field.int({ default: 0 }),
        active: field.boolean({ default: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      indexes: [
        unique(['slug'], 'ProductCategory_slug_key'),
        index(['active', 'position'], 'ProductCategory_active_position_idx')
      ]
    }),
    ProductLot: defineModel({
      tableName: 'ProductLot',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        name: field.string(),
        slug: field.string({ unique: true }),
        saleType: field.enum(productSaleTypes, { default: 'SALE' }),
        categoryId: field.int({ nullable: true }),
        description: field.string({ nullable: true }),
        imageUrl: field.string({ nullable: true }),
        kind: field.enum(productLotKinds, { default: 'LOT' }),
        price: field.decimal({ default: 0 }),
        vatRate: field.decimal({ default: 20 }),
        paymentTaxCode: field.string({ nullable: true }),
        paymentTaxBehavior: field.enum(stripeTaxBehaviors, { nullable: true }),
        stock: field.int({ default: 0 }),
        rentalAvailableFrom: field.datetime({ nullable: true }),
        rentalAvailableTo: field.datetime({ nullable: true }),
        rentalMinDays: field.int({ default: 1 }),
        rentalMaxDays: field.int({ nullable: true }),
        allowOfflinePayment: field.boolean({ default: true }),
        allowOnlinePayment: field.boolean({ default: false }),
        active: field.boolean({ default: true }),
        position: field.int({ default: 0 }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        category: relation.belongsTo('ProductCategory', 'categoryId', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        unique(['slug'], 'ProductLot_slug_key'),
        index(['categoryId'], 'ProductLot_categoryId_idx'),
        index(['saleType'], 'ProductLot_saleType_idx'),
        index(['active', 'position'], 'ProductLot_active_position_idx')
      ]
    }),
    ProductLotItem: defineModel({
      tableName: 'ProductLotItem',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        productLotId: field.int(),
        productId: field.int(),
        quantity: field.decimal()
      },
      relations: {
        productLot: relation.belongsTo('ProductLot', 'productLotId', 'id', { onDelete: 'cascade' }),
        product: relation.belongsTo('Product', 'productId', 'id', { onDelete: 'restrict' })
      },
      indexes: [
        unique(['productLotId', 'productId'], 'ProductLotItem_productLotId_productId_key'),
        index(['productLotId'], 'ProductLotItem_productLotId_idx'),
        index(['productId'], 'ProductLotItem_productId_idx')
      ]
    }),
    BillingDocumentTemplate: defineModel({
      tableName: 'BillingDocumentTemplate',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        kind: field.enum(billingDocumentKinds, { default: 'CONTRACT' }),
        slug: field.string({ unique: true }),
        name: field.string(),
        description: field.string({ nullable: true }),
        brandName: field.string({ nullable: true }),
        logoUrl: field.string({ nullable: true }),
        accentColor: field.string({ nullable: true }),
        sourcePdfUrl: field.string({ nullable: true }),
        titleJson: field.string({ default: '{"fr":"","en":""}' }),
        contentJson: field.string({ default: '{"fr":"","en":""}' }),
        footerJson: field.string({ default: '{"fr":"","en":""}' }),
        active: field.boolean({ default: true }),
        isDefault: field.boolean({ default: false }),
        position: field.int({ default: 0 }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      indexes: [
        unique(['slug'], 'BillingDocumentTemplate_slug_key'),
        index(['kind', 'active', 'position'], 'BillingDocumentTemplate_kind_active_position_idx'),
        index(['kind', 'isDefault'], 'BillingDocumentTemplate_kind_isDefault_idx')
      ]
    }),
    ShopOrder: defineModel({
      tableName: 'ShopOrder',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        orderNumber: field.string({ unique: true }),
        userId: field.int({ nullable: true }),
        language: field.string({ default: 'fr' }),
        status: field.enum(shopOrderStatuses, { default: 'PENDING' }),
        paymentProvider: field.enum(shopPaymentProviders, { default: 'OFFLINE' }),
        paymentStatus: field.enum(shopPaymentStatuses, { default: 'UNPAID' }),
        providerSessionId: field.string({ nullable: true, unique: true }),
        providerPaymentIntentId: field.string({ nullable: true, unique: true }),
        providerPaymentStatus: field.string({ nullable: true }),
        providerLastEventId: field.string({ nullable: true }),
        paymentFailureReason: field.string({ nullable: true }),
        customerName: field.string(),
        email: field.string(),
        phone: field.string({ nullable: true }),
        message: field.string({ nullable: true }),
        deliveryType: field.enum(deliveryTypes, { nullable: true }),
        pickupPointId: field.int({ nullable: true }),
        deliveryTourId: field.int({ nullable: true }),
        deliveryAddress: field.string({ nullable: true }),
        deliveryCity: field.string({ nullable: true }),
        deliveryPostalCode: field.string({ nullable: true }),
        rentalStartDate: field.datetime({ nullable: true }),
        rentalEndDate: field.datetime({ nullable: true }),
        fulfillmentDate: field.datetime({ nullable: true }),
        fulfillmentTime: field.string({ nullable: true }),
        fulfillmentLocation: field.string({ nullable: true }),
        currency: field.string({ default: 'eur' }),
        subtotal: field.decimal({ default: 0 }),
        total: field.decimal({ default: 0 }),
        checkoutUrl: field.string({ nullable: true }),
        paidAt: field.datetime({ nullable: true }),
        refundedAt: field.datetime({ nullable: true }),
        cancelledAt: field.datetime({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        user: relation.belongsTo('User', 'userId', 'id', { onDelete: 'setNull' }),
        pickupPoint: relation.belongsTo('PickupPoint', 'pickupPointId', 'id', { onDelete: 'setNull' }),
        deliveryTour: relation.belongsTo('DeliveryTour', 'deliveryTourId', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        unique(['orderNumber'], 'ShopOrder_orderNumber_key'),
        unique(['providerSessionId'], 'ShopOrder_providerSessionId_key'),
        unique(['providerPaymentIntentId'], 'ShopOrder_providerPaymentIntentId_key'),
        index(['status', 'createdAt'], 'ShopOrder_status_createdAt_idx'),
         index(['paymentStatus', 'createdAt'], 'ShopOrder_paymentStatus_createdAt_idx'),
         index(['status', 'rentalStartDate'], 'ShopOrder_status_rentalStartDate_idx'),
         index(['userId'], 'ShopOrder_userId_idx'),
        index(['pickupPointId'], 'ShopOrder_pickupPointId_idx'),
        index(['deliveryTourId'], 'ShopOrder_deliveryTourId_idx')
      ]
    }),
    ShopOrderLine: defineModel({
      tableName: 'ShopOrderLine',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        orderId: field.int(),
        productLotId: field.int({ nullable: true }),
        productId: field.int({ nullable: true }),
        title: field.string(),
        quantity: field.int({ default: 1 }),
        unitPrice: field.decimal({ default: 0 }),
        totalPrice: field.decimal({ default: 0 }),
        rentalStartDate: field.datetime({ nullable: true }),
        rentalEndDate: field.datetime({ nullable: true }),
        metaJson: field.string({ default: '{}' }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        order: relation.belongsTo('ShopOrder', 'orderId', 'id', { onDelete: 'cascade' }),
        productLot: relation.belongsTo('ProductLot', 'productLotId', 'id', { onDelete: 'setNull' }),
        product: relation.belongsTo('Product', 'productId', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        index(['orderId'], 'ShopOrderLine_orderId_idx'),
        index(['productLotId'], 'ShopOrderLine_productLotId_idx'),
        index(['productId'], 'ShopOrderLine_productId_idx'),
        index(['productId', 'rentalStartDate'], 'ShopOrderLine_productId_rentalStartDate_idx'),
        index(['productLotId', 'rentalStartDate'], 'ShopOrderLine_productLotId_rentalStartDate_idx')
      ]
    }),
    Article: defineModel({
      tableName: 'Article',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        title: field.string(),
        slug: field.string({ unique: true }),
        excerpt: field.string({ nullable: true }),
        content: field.string(),
        coverUrl: field.string({ nullable: true }),
        published: field.boolean({ default: false }),
        publishedAt: field.datetime({ nullable: true }),
        authorId: field.int({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        author: relation.belongsTo('User', 'authorId', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        unique(['slug'], 'Article_slug_key'),
        index(['published', 'publishedAt'], 'Article_published_publishedAt_idx')
      ]
    }),
    Image: defineModel({
      tableName: 'Image',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        filename: field.string(),
        url: field.string(),
        mimeType: field.string(),
        size: field.int(),
        width: field.int({ nullable: true }),
        height: field.int({ nullable: true }),
        uploadedById: field.int({ nullable: true }),
        createdAt: field.datetime({ default: 'now' })
      },
      relations: {
        uploadedBy: relation.belongsTo('User', 'uploadedById', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        index(['createdAt'], 'Image_createdAt_idx')
      ]
    }),
    ImageVariant: defineModel({
      tableName: 'ImageVariant',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        imageId: field.int(),
        storageKey: field.string({ unique: true }),
        mimeType: field.string(),
        size: field.int(),
        width: field.int({ nullable: true }),
        height: field.int({ nullable: true }),
        fit: field.string({ nullable: true }),
        quality: field.int({ nullable: true }),
        format: field.string(),
        createdAt: field.datetime({ default: 'now' })
      },
      relations: {
        image: relation.belongsTo('Image', 'imageId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        unique(['storageKey'], 'ImageVariant_storageKey_key'),
        unique(['imageId', 'width', 'height', 'fit', 'quality', 'format'], 'ImageVariant_unique_signature'),
        index(['imageId', 'createdAt'], 'ImageVariant_imageId_createdAt_idx')
      ]
    }),
    ImageUsage: defineModel({
      tableName: 'ImageUsage',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        imageId: field.int(),
        scopeType: field.string(),
        scopeId: field.string(),
        fieldKey: field.string(),
        label: field.string(),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        image: relation.belongsTo('Image', 'imageId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        unique(['imageId', 'scopeType', 'scopeId', 'fieldKey'], 'ImageUsage_unique_scope'),
        index(['imageId', 'scopeType'], 'ImageUsage_imageId_scopeType_idx')
      ]
    }),
    Event: defineModel({
      tableName: 'Event',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        slug: field.string({ unique: true }),
        kind: field.enum(eventKinds, { default: 'EVENT' }),
        status: field.enum(eventStatuses, { default: 'DRAFT' }),
        visibility: field.enum(eventVisibilities, { default: 'PUBLIC' }),
        startsAt: field.datetime(),
        endsAt: field.datetime({ nullable: true }),
        recurrenceType: field.enum(eventRecurrenceTypes, { default: 'NONE' }),
        recurrenceDaysJson: field.string({ default: '[]' }),
        recurrenceStartDate: field.datetime({ nullable: true }),
        recurrenceEndDate: field.datetime({ nullable: true }),
        recurrenceStartTime: field.string({ nullable: true }),
        recurrenceEndTime: field.string({ nullable: true }),
        placeName: field.string({ nullable: true }),
        placeAddress: field.string({ nullable: true }),
        placeCity: field.string({ nullable: true }),
        mapUrl: field.string({ nullable: true }),
        coverImageUrl: field.string({ nullable: true }),
        galleryJson: field.string({ default: '[]' }),
        publicCapacity: field.int({ nullable: true }),
        internalCapacity: field.int({ nullable: true }),
        publicReservationEnabled: field.boolean({ default: false }),
        internalParticipationEnabled: field.boolean({ default: false }),
        internalParticipationApprovalMode: field.enum(eventApprovalModes, { default: 'MANUAL' }),
        internalParticipationInfo: field.string({ nullable: true }),
        notifyAdminOnInternalParticipation: field.boolean({ default: true }),
        translationsJson: field.string(),
        createdById: field.int({ nullable: true }),
        updatedById: field.int({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        createdBy: relation.belongsTo('User', 'createdById', 'id', { onDelete: 'setNull' }),
        updatedBy: relation.belongsTo('User', 'updatedById', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        unique(['slug'], 'Event_slug_key'),
        index(['kind', 'status', 'startsAt'], 'Event_kind_status_startsAt_idx'),
        index(['status', 'startsAt'], 'Event_status_startsAt_idx'),
        index(['visibility', 'startsAt'], 'Event_visibility_startsAt_idx'),
        index(['createdById'], 'Event_createdById_idx'),
        index(['updatedById'], 'Event_updatedById_idx')
      ]
    }),
    EventOccurrence: defineModel({
      tableName: 'EventOccurrence',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        eventId: field.int(),
        occurrenceDate: field.datetime(),
        startsAt: field.datetime(),
        endsAt: field.datetime({ nullable: true }),
        status: field.enum(eventOccurrenceStatuses, { default: 'SCHEDULED' }),
        isOverride: field.boolean({ default: false }),
        titleOverride: field.string({ nullable: true }),
        subtitleOverride: field.string({ nullable: true }),
        excerptOverride: field.string({ nullable: true }),
        contentOverrideJson: field.string({ nullable: true }),
        placeNameOverride: field.string({ nullable: true }),
        placeAddressOverride: field.string({ nullable: true }),
        placeCityOverride: field.string({ nullable: true }),
        mapUrlOverride: field.string({ nullable: true }),
        coverImageOverrideUrl: field.string({ nullable: true }),
        publicCapacityOverride: field.int({ nullable: true }),
        internalCapacityOverride: field.int({ nullable: true }),
        internalParticipationInfoOverride: field.string({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        event: relation.belongsTo('Event', 'eventId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        unique(['eventId', 'occurrenceDate'], 'EventOccurrence_eventId_occurrenceDate_key'),
        index(['occurrenceDate', 'status'], 'EventOccurrence_occurrenceDate_status_idx'),
        index(['eventId', 'startsAt'], 'EventOccurrence_eventId_startsAt_idx')
      ]
    }),
    EventAudienceMemberRole: defineModel({
      tableName: 'EventAudienceMemberRole',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        eventId: field.int(),
        memberRoleId: field.int(),
        createdAt: field.datetime({ default: 'now' })
      },
      relations: {
        event: relation.belongsTo('Event', 'eventId', 'id', { onDelete: 'cascade' }),
        memberRole: relation.belongsTo('MemberRole', 'memberRoleId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        unique(['eventId', 'memberRoleId'], 'EventAudienceMemberRole_eventId_memberRoleId_key'),
        index(['memberRoleId'], 'EventAudienceMemberRole_memberRoleId_idx')
      ]
    }),
    EventPublicReservation: defineModel({
      tableName: 'EventPublicReservation',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        eventId: field.int(),
        userId: field.int({ nullable: true }),
        customerName: field.string(),
        email: field.string(),
        phone: field.string({ nullable: true }),
        seats: field.int({ default: 1 }),
        message: field.string({ nullable: true }),
        status: field.enum(eventPublicReservationStatuses, { default: 'PENDING' }),
        adminNote: field.string({ nullable: true }),
        confirmedAt: field.datetime({ nullable: true }),
        cancelledAt: field.datetime({ nullable: true }),
        rejectedAt: field.datetime({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        event: relation.belongsTo('Event', 'eventId', 'id', { onDelete: 'cascade' }),
        user: relation.belongsTo('User', 'userId', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        index(['eventId', 'status', 'createdAt'], 'EventPublicReservation_eventId_status_createdAt_idx'),
        index(['userId'], 'EventPublicReservation_userId_idx')
      ]
    }),
    EventInternalParticipation: defineModel({
      tableName: 'EventInternalParticipation',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        eventId: field.int(),
        userId: field.int(),
        message: field.string({ nullable: true }),
        status: field.enum(eventInternalParticipationStatuses, { default: 'PENDING' }),
        adminNote: field.string({ nullable: true }),
        confirmedAt: field.datetime({ nullable: true }),
        cancelledAt: field.datetime({ nullable: true }),
        rejectedAt: field.datetime({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        event: relation.belongsTo('Event', 'eventId', 'id', { onDelete: 'cascade' }),
        user: relation.belongsTo('User', 'userId', 'id', { onDelete: 'cascade' })
      },
      indexes: [
        unique(['eventId', 'userId'], 'EventInternalParticipation_eventId_userId_key'),
        index(['status', 'createdAt'], 'EventInternalParticipation_status_createdAt_idx'),
        index(['userId'], 'EventInternalParticipation_userId_idx')
      ]
    }),
    CmsPage: defineModel({
      tableName: 'CmsPage',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        path: field.string({ unique: true }),
        slug: field.string({ unique: true }),
        title: field.string(),
        pageType: field.enum(cmsPageTypes, { default: 'CMS' }),
        status: field.enum(cmsPageStatuses, { default: 'DRAFT' }),
        specialRole: field.string({ nullable: true }),
        templateKey: field.string({ default: 'default' }),
        rendererKey: field.string({ nullable: true }),
        applicationPosition: field.enum(cmsApplicationPositions, { default: 'AFTER_CONTENT' }),
        translationsJson: field.string(),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      indexes: [
        unique(['path'], 'CmsPage_path_key'),
        unique(['slug'], 'CmsPage_slug_key'),
        index(['status', 'pageType'], 'CmsPage_status_pageType_idx')
      ]
    }),
    CmsNavigationItem: defineModel({
      tableName: 'CmsNavigationItem',
      primaryKey: 'id',
      fields: {
        id: field.id(),
        menu: field.enum(cmsNavigationMenus, { default: 'PRIMARY' }),
        itemType: field.enum(cmsNavigationItemTypes, { default: 'CMS_PAGE' }),
        title: field.string(),
        labelsJson: field.string(),
        href: field.string(),
        newTab: field.boolean({ default: false }),
        visible: field.boolean({ default: true }),
        position: field.int({ default: 0 }),
        pageId: field.int({ nullable: true }),
        createdAt: field.datetime({ default: 'now' }),
        updatedAt: field.datetime()
      },
      relations: {
        page: relation.belongsTo('CmsPage', 'pageId', 'id', { onDelete: 'setNull' })
      },
      indexes: [
        index(['menu', 'visible', 'position'], 'CmsNavigationItem_menu_visible_position_idx'),
        index(['pageId'], 'CmsNavigationItem_pageId_idx')
      ]
    })
  }
})

export type CmsDataSchema = typeof cmsDataSchema
