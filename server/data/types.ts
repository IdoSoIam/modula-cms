import type {
  ArticleRecord,
  BillingDocumentTemplateRecord,
  CmsNavigationItemRecord,
  CmsPageRecord,
  DeliveryTourRecord,
  EventAudienceMemberRoleRecord,
  EventInternalParticipationRecord,
  EventOccurrenceRecord,
  EventPublicReservationRecord,
  EventRecord,
  ImageRecord,
  ImageUsageRecord,
  ImageVariantRecord,
  MemberRoleRecord,
  PasswordSetupTokenRecord,
  ProductCategoryRecord,
  ProductRecord,
  PickupPointRecord,
  RolePermissionRecord,
  RoleRecord,
  ShopOrderLineRecord,
  ShopOrderRecord,
  SiteParamsRecord,
  TourCityRecord,
  UserMemberRoleRecord,
  UserRecord
} from '#modula/server/generated/models.generated'

export type SiteParams = SiteParamsRecord
export type User = UserRecord
export type PasswordSetupToken = PasswordSetupTokenRecord
export type Role = RoleRecord
export type RolePermission = RolePermissionRecord
export type MemberRole = MemberRoleRecord
export type UserMemberRole = UserMemberRoleRecord
export type BillingDocumentTemplate = BillingDocumentTemplateRecord
export type PickupPoint = PickupPointRecord
export type DeliveryTour = DeliveryTourRecord
export type TourCity = TourCityRecord
export type Product = ProductRecord
export type ProductCategory = ProductCategoryRecord
export type ShopOrder = ShopOrderRecord
export type ShopOrderLine = ShopOrderLineRecord
export type Article = ArticleRecord
export type Image = ImageRecord
export type ImageVariant = ImageVariantRecord
export type ImageUsage = ImageUsageRecord
export type Event = EventRecord
export type EventOccurrence = EventOccurrenceRecord
export type EventAudienceMemberRole = EventAudienceMemberRoleRecord
export type EventPublicReservation = EventPublicReservationRecord
export type EventInternalParticipation = EventInternalParticipationRecord
export type CmsPage = CmsPageRecord
export type CmsNavigationItem = CmsNavigationItemRecord

export type DeliveryType = ShopOrderRecord['deliveryType']

export namespace DbTypes {
  export type EventWhereInput = any
  export type EventInclude = any
  export type UserSelect = any
  export type UserInclude = any
  export type RoleInclude = any
  export type ProductInclude = any
  export type ProductCategoryInclude = any
  export type ShopOrderInclude = any
  export type DeliveryTourInclude = any
  export type CmsPageInclude = any
  export type CmsNavigationItemInclude = any
}
