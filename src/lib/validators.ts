/**
 * Validators e helpers para CPF, CNPJ, Email, etc.
 */

/**
 * Valida CPF
 */
export function isValidCPF(cpf: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = cpf.replace(/\D/g, '');

  // CPF deve ter 11 dígitos
  if (cleaned.length !== 11) return false;

  // CPFs com todos os dígitos iguais são inválidos
  if (/^(\d)\1{10}$/.test(cleaned)) return false;

  // Validação dos dígitos verificadores
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned.charAt(i)) * (10 - i);
  }
  let remainder = 11 - (sum % 11);
  const digit1 = remainder >= 10 ? 0 : remainder;

  if (digit1 !== parseInt(cleaned.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cleaned.charAt(i)) * (11 - i);
  }
  remainder = 11 - (sum % 11);
  const digit2 = remainder >= 10 ? 0 : remainder;

  return digit2 === parseInt(cleaned.charAt(10));
}

/**
 * Valida CNPJ
 */
export function isValidCNPJ(cnpj: string): boolean {
  // Remove caracteres não numéricos
  const cleaned = cnpj.replace(/\D/g, '');

  // CNPJ deve ter 14 dígitos
  if (cleaned.length !== 14) return false;

  // CNPJs com todos os dígitos iguais são inválidos
  if (/^(\d)\1{13}$/.test(cleaned)) return false;

  // Validação do primeiro dígito verificador
  let sum = 0;
  let weight = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  let remainder = sum % 11;
  const digit1 = remainder < 2 ? 0 : 11 - remainder;

  if (digit1 !== parseInt(cleaned.charAt(12))) return false;

  // Validação do segundo dígito verificador
  sum = 0;
  weight = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cleaned.charAt(i)) * weight;
    weight = weight === 2 ? 9 : weight - 1;
  }
  remainder = sum % 11;
  const digit2 = remainder < 2 ? 0 : 11 - remainder;

  return digit2 === parseInt(cleaned.charAt(13));
}

/**
 * Detecta automaticamente se é CPF ou CNPJ
 */
export function detectDocumentType(value: string): 'cpf' | 'cnpj' | 'invalid' {
  const cleaned = value.replace(/\D/g, '');

  if (cleaned.length === 11 && isValidCPF(cleaned)) {
    return 'cpf';
  }

  if (cleaned.length === 14 && isValidCNPJ(cleaned)) {
    return 'cnpj';
  }

  return 'invalid';
}

/**
 * Formata CPF: 000.000.000-00
 */
export function formatCPF(cpf: string): string {
  const cleaned = cpf.replace(/\D/g, '');
  return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
}

/**
 * Formata CNPJ: 00.000.000/0000-00
 */
export function formatCNPJ(cnpj: string): string {
  const cleaned = cnpj.replace(/\D/g, '');
  return cleaned.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
}

/**
 * Formata automaticamente CPF ou CNPJ
 */
export function formatDocument(value: string): string {
  const type = detectDocumentType(value);
  if (type === 'cpf') return formatCPF(value);
  if (type === 'cnpj') return formatCNPJ(value);
  return value;
}

/**
 * Valida email
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Mascara input de CPF/CNPJ durante digitação
 */
export function maskDocument(value: string): string {
  const cleaned = value.replace(/\D/g, '');

  // CPF: máximo 11 dígitos
  if (cleaned.length <= 11) {
    return cleaned
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  }

  // CNPJ: máximo 14 dígitos
  return cleaned
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

/**
 * Remove formatação de documentos
 */
export function cleanDocument(value: string): string {
  return value.replace(/\D/g, '');
}
