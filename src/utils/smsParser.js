const normalizePhone = (raw) => {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length < 9) return null;
  return digits.slice(-9);
};

const parseAirtelSms = (smsText) => {
  if (!smsText) return { isAirtel: false };

  const normalized = smsText.replace(/\s+/g, ' ').trim();
  const isAirtel = /Vous avez recu/i.test(normalized) && /FCFA/i.test(normalized) && /transaction de/i.test(normalized);

  if (!isAirtel) return { isAirtel: false };

  const amountMatch = normalized.match(/transaction de\s+(\d+)/i);
  const phoneMatch = normalized.match(/du\s+(\d{9})/i);
  const tidMatch = normalized.match(/TID:\s*([^\s]+.*)$/i);

  const amount = amountMatch ? parseInt(amountMatch[1], 10) : null;
  const phone = phoneMatch ? normalizePhone(phoneMatch[1]) : null;
  const transactionId = tidMatch ? tidMatch[1].trim() : '';

  return { isAirtel, amount, phone, transactionId, normalized };
};

module.exports = { normalizePhone, parseAirtelSms };
