export class HealthEntity {
  readonly status: string;
  readonly timestamp: Date;

  constructor( data: { status: string; timestamp: Date }) {
    this.status = data.status;
    this.timestamp = data.timestamp;
  }
}