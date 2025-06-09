export interface BusArrivalData {
  line?: string;
  description?: string;
  remainingArrivalTime?: string;
  error?: string;
}

export interface FormattedBusArrivalData extends BusArrivalData {
  letter: string;
}
