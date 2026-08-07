import { User } from '../../users/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Payment } from '../../payments/entities/payment.entity';
import { OrderItems } from './oder-item.entity';
import { OrderStatus } from '../orders.constants';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 15, unique: true })
  orderCode!: string;

  @Column({ name: 'recipient_name', type: 'varchar', length: 100 })
  recipientName!: string;

  @Column({ name: 'recipient_phone', type: 'varchar', length: 12 })
  recipientPhone!: string;

  @Column({ name: 'recipient_address', type: 'varchar', length: 255 })
  recipientAddress!: string;

  @Column({ name: 'total_amount', type: 'decimal', default: 0 })
  totalAmount!: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status!: OrderStatus;

  @Column({ name: 'reject_reason', type: 'text', nullable: true })
  rejectReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @ManyToOne(() => User, (user) => user.orders, {
    nullable: false,
    onDelete: 'RESTRICT',
  })
  @JoinColumn({ name: 'user_id' })
  user!: User;

  @OneToMany(() => OrderItems, (item) => item.order)
  orderItems: OrderItems[];

  @OneToOne(() => Payment, (payment) => payment.order)
  payment: Payment;
}
