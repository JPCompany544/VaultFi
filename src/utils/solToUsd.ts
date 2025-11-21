export function solToUsd(solAmount: number, solPrice: number | null | undefined): string {
  if (!Number.isFinite(solAmount) || !Number.isFinite(solPrice as number) || !solPrice || solPrice <= 0) {
    return "$0.00";
  }
  const usd = solAmount * (solPrice as number);
  return `$${usd.toFixed(2)}`;
}
