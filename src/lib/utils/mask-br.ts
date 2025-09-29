/** Máscara de moeda BRL com 2 casas (ex.: "1234" -> "R$ 12,34") */
export function maskCurrencyBRL(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const number = Number(digits) / 100;
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(number);
}

/** Remove formatação BRL e retorna número (ex.: "R$ 12,34" -> 12.34) */
export function unmaskCurrencyBRL(masked: string): number {
  return Number(
    masked
      .replace(/[^\d,-]/g, "")
      .replace(/\./g, "")
      .replace(",", ".")
  );
}

/** Máscara para litros com 2 casas decimais (ex.: "1234" -> "12,34") */
export function maskLiters2(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const number = Number(digits) / 100;
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Máscara para preço por litro com 2 casas decimais (ex.: "712" -> "7,12") */
export function maskPricePerLiter2(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  const number = Number(digits) / 100;
  return number.toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Máscara para hodômetro (apenas dígitos, sem separadores) */
export function maskOdometer(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, 7); // limita a 7 dígitos (até 9.999.999 km)
}

/** Máscara simplificada para placa (maiúsculas, sem espaços) */
export function maskPlate(raw: string): string {
  return raw.toUpperCase().replace(/\s+/g, "").slice(0, 8); // ex.: ABC1D23 (até 8 chars)
}
