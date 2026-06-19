import type {
  ArticleRecord,
  BasketItemRecord,
  BasketRecord,
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
  ProductLotItemRecord,
  ProductLotRecord,
  ProductCategoryRecord,
  ProductRecord,
  PickupPointRecord,
  ReservationNotificationRecord,
  ReservationOccurrenceRecord,
  ReservationRecord,
  ReservationScheduleProposalRecord,
  RolePermissionRecord,
  RoleRecord,
  ShopOrderLineRecord,
  ShopOrderRecord,
  SiteParamsRecord,
  TourCityRecord,
  UserMemberRoleRecord,
  UserRecord,
  VegetableRecord
} from '#modula/server/generated/models.generated'

export type SiteParams = SiteParamsRecord
export type User = UserRecord
export type PasswordSetupToken = PasswordSetupTokenRecord
export type Role = RoleRecord
export type RolePermission = RolePermissionRecord
export type MemberRole = MemberRoleRecord
export type UserMemberRole = UserMemberRoleRecord
export type Vegetable = VegetableRecord
export type Basket = BasketRecord
export type BasketItem = BasketItemRecord
export type Reservation = ReservationRecord
export type ReservationScheduleProposal = ReservationScheduleProposalRecord
export type ReservationOccurrence = ReservationOccurrenceRecord
export type ReservationNotification = ReservationNotificationRecord
export type PickupPoint = PickupPointRecord
export type DeliveryTour = DeliveryTourRecord
export type TourCity = TourCityRecord
export type Product = ProductRecord
export type ProductCategory = ProductCategoryRecord
export type ProductLot = ProductLotRecord
export type ProductLotItem = ProductLotItemRecord
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

export type DeliveryType = ReservationRecord['deliveryType']
export type ReservationScheduleProposalSource = ReservationScheduleProposalRecord['proposedBy']

export namespace DbTypes {
  export type ReservationInclude = any
  export type ReservationWhereInput = any
  export type EventWhereInput = any
  export type EventInclude = any
  export type UserSelect = any
  export type UserInclude = any
  export type RoleInclude = any
  export type BasketInclude = any
  export type ProductInclude = any
  export type ProductCategoryInclude = any
  export type ProductLotInclude = any
  export type ShopOrderInclude = any
  export type DeliveryTourInclude = any
  export type CmsPageInclude = any
  export type CmsNavigationItemInclude = any
}
