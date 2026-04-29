const errorMap: Record<string, string> = {
  'User already registered': 'Este e-mail já está cadastrado.',
  'Invalid login credentials': 'Credenciais inválidas. Verifique e tente novamente.',
  'Email not confirmed': 'E-mail não confirmado. Verifique sua caixa de entrada.',
  'Password should be at least 6 characters': 'A senha deve ter pelo menos 6 caracteres.',
  'Signup requires a valid password': 'Insira uma senha válida.',
  'Unable to validate email address: invalid format': 'Formato de e-mail inválido.',
  'Email rate limit exceeded': 'Muitas tentativas. Aguarde alguns minutos.',
  'For security purposes, you can only request this after': 'Por segurança, aguarde antes de tentar novamente.',
  'New password should be different from the old password': 'A nova senha deve ser diferente da senha atual.',
  'Auth session missing': 'Sessão expirada. Faça login novamente.',
  'Token has expired or is invalid': 'Link expirado ou inválido.',
  'over_email_send_rate_limit': 'Limite de envio de e-mails excedido. Aguarde.',
};

export function translateError(message: string): string {
  for (const [key, value] of Object.entries(errorMap)) {
    if (message.includes(key)) return value;
  }
  return message;
}
