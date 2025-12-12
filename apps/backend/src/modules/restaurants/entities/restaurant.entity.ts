import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn
} from 'typeorm';

@Entity({ name: 'restaurants' })
export class RestaurantEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 255 })
  name!: string;

  @Index({ unique: true })
  @Column({ length: 120 })
  slug!: string;

  @Index({ unique: true })
  @Column({ length: 20 })
  phone!: string;

  @Index({ unique: true })
  @Column({ length: 255, nullable: true })
  email!: string | null;

  @Column({ name: 'owner_name', length: 255, nullable: true })
  ownerName!: string | null;

  @Column({ name: 'owner_phone', length: 20, nullable: true })
  ownerPhone!: string | null;

  @Column({ type: 'text' })
  address!: string;

  @Column({ type: 'float', nullable: true })
  latitude!: number | null;

  @Column({ type: 'float', nullable: true })
  longitude!: number | null;

  @Index()
  @Column({ name: 'zone_id', nullable: true })
  zoneId!: string | null;

  @Column({ length: 120, nullable: true })
  city!: string | null;

  @Column({ length: 120, nullable: true })
  state!: string | null;

  @Column({ length: 120, nullable: true })
  country!: string | null;

  @Column({ name: 'postal_code', length: 20, nullable: true })
  postalCode!: string | null;

  @Column({ length: 24, default: 'active' })
  status!: string;

  @Column({ name: 'is_verified', type: 'boolean', default: false })
  isVerified!: boolean;

  @Column({ name: 'opens_at', type: 'time', nullable: true })
  opensAt!: string | null;

  @Column({ name: 'closes_at', type: 'time', nullable: true })
  closesAt!: string | null;

  @Column({ name: 'service_hours', type: 'jsonb', nullable: true })
  serviceHours!: Record<string, unknown> | null;

  @Column({ name: 'prep_time_seconds', type: 'int', default: 0 })
  prepTimeSeconds!: number;

  @Column({ name: 'order_acceptance_mode', length: 24, default: 'auto' })
  orderAcceptanceMode!: string;

  @Column({ name: 'max_concurrent_orders', type: 'int', nullable: true })
  maxConcurrentOrders!: number | null;

  @Column({ name: 'accepting_orders', type: 'boolean', default: true })
  acceptingOrders!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  cuisines!: string[] | null;

  @Column({ name: 'dietary_tags', type: 'jsonb', nullable: true })
  dietaryTags!: string[] | null;

  @Column({ name: 'logo_url', length: 255, nullable: true })
  logoUrl!: string | null;

  @Column({ name: 'banner_url', length: 255, nullable: true })
  bannerUrl!: string | null;

  @Column({ name: 'commission_rate', type: 'decimal', precision: 5, scale: 2, default: 0 })
  commissionRate!: number;

  @Column({ name: 'delivery_fee_share', type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFeeShare!: number;

  @Column({ name: 'tax_id', length: 64, nullable: true })
  taxId!: string | null;

  @Column({ name: 'bank_account', type: 'jsonb', nullable: true })
  bankAccount!: Record<string, unknown> | null;

  @Column({ name: 'payout_cycle', length: 24, default: 'weekly' })
  payoutCycle!: string;

  @Column({ name: 'payout_threshold', type: 'decimal', precision: 10, scale: 2, default: 0 })
  payoutThreshold!: number;

  @Column({ name: 'rating_avg', type: 'float', nullable: true })
  ratingAvg!: number | null;

  @Column({ name: 'rating_count', type: 'int', default: 0 })
  ratingCount!: number;

  @Column({ name: 'last_health_check_at', type: 'timestamptz', nullable: true })
  lastHealthCheckAt!: Date | null;

  @Column({ name: 'is_compliant', type: 'boolean', default: true })
  isCompliant!: boolean;

  @Column({ name: 'pickup_instructions', type: 'text', nullable: true })
  pickupInstructions!: string | null;

  @Column({ name: 'pickup_ready_eta_seconds', type: 'int', nullable: true })
  pickupReadyEtaSeconds!: number | null;

  @Column({ name: 'packing_charge', type: 'decimal', precision: 10, scale: 2, default: 0 })
  packingCharge!: number;

  @Column({ name: 'min_order_value', type: 'decimal', precision: 10, scale: 2, default: 0 })
  minOrderValue!: number;

  @Column({ name: 'max_delivery_distance_km', type: 'float', nullable: true })
  maxDeliveryDistanceKm!: number | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
