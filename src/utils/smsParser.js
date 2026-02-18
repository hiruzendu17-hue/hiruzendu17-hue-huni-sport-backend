const normalizePhone = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 9) return null;
  return digits.slice(-9);
};

const parseAirtelSms = (smsText) => {
  if (!smsText) return { isAirtel: false };

  const normalized = smsText.replace(/\s+/g, ' ').trim();
  const isAirtel =
    /vous avez recu/i.test(normalized) ||
    /airtel/i.test(normalized) ||
    /airtel money/i.test(normalized);

  if (!isAirtel) return { isAirtel: false };

  // Montant avec séparateurs ou décimales (ex: 5 150, 5.150, 5,150.00)
  const amountMatch = normalized.match(/transaction de\s*([\d\s.,]+)/i);
  const phoneMatch = normalized.match(/du\s+(\d{9,15})/i);
  // TID strict : après "TID:" uniquement lettres/chiffres/.- sans espaces
  const tidMatch = normalized.match(/TID:\s*([A-Za-z0-9.\-]+)/i);

  let amount = null;
  if (amountMatch && amountMatch[1]) {
    const cleaned = amountMatch[1].replace(/\s+/g, '').replace(/,/g, '.');
    const parsed = parseFloat(cleaned.replace(/[^0-9.]/g, ''));
    if (!Number.isNaN(parsed)) {
      amount = Math.round(parsed); // FCFA sans centimes -> arrondi
    }
  }

  const phone = phoneMatch ? normalizePhone(phoneMatch[1]) : null;
  const transactionId = tidMatch ? tidMatch[1].trim() : '';

  return { isAirtel, amount, phone, transactionId, normalized };
};

module.exports = { normalizePhone, parseAirtelSms };
