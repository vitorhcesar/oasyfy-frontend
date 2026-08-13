const errorMap: Record<string, string> = {
  "User already exists. Use another email.":
    "Este e-mail já está cadastrado. Use outro e-mail.",
  "User already exists": "Este e-mail já está cadastrado. Use outro e-mail.",
  "User already registered": "Este e-mail já está cadastrado.",
  USER_ALREADY_EXISTS: "Este e-mail já está cadastrado. Use outro e-mail.",
  "Invalid login credentials":
    "Credenciais inválidas. Verifique e tente novamente.",
  "Invalid email or password": "E-mail ou senha inválidos.",
  INVALID_EMAIL_OR_PASSWORD: "E-mail ou senha inválidos.",
  "Invalid password": "Senha inválida.",
  INVALID_PASSWORD: "Senha inválida.",
  "Invalid email": "E-mail inválido.",
  INVALID_EMAIL: "E-mail inválido.",
  "Email not confirmed": "E-mail não confirmado. Verifique sua caixa de entrada.",
  "Email not verified": "E-mail não verificado. Verifique sua caixa de entrada.",
  EMAIL_NOT_VERIFIED: "E-mail não verificado. Verifique sua caixa de entrada.",
  "Password should be at least 6 characters":
    "A senha deve ter pelo menos 6 caracteres.",
  "Password too short": "A senha é muito curta.",
  "Password is too short": "A senha é muito curta.",
  PASSWORD_TOO_SHORT: "A senha é muito curta.",
  "Password too long": "A senha é muito longa.",
  "Password is too long": "A senha é muito longa.",
  PASSWORD_TOO_LONG: "A senha é muito longa.",
  "Signup requires a valid password": "Insira uma senha válida.",
  "Unable to validate email address: invalid format":
    "Formato de e-mail inválido.",
  "Email rate limit exceeded": "Muitas tentativas. Aguarde alguns minutos.",
  "For security purposes, you can only request this after":
    "Por segurança, aguarde antes de tentar novamente.",
  "New password should be different from the old password":
    "A nova senha deve ser diferente da senha atual.",
  "Auth session missing": "Sessão expirada. Faça login novamente.",
  "Token has expired or is invalid": "Link expirado ou inválido.",
  "Invalid token": "Token inválido.",
  "invalid token": "Token inválido.",
  INVALID_TOKEN: "Token inválido.",
  over_email_send_rate_limit: "Limite de envio de e-mails excedido. Aguarde.",
  "User not found": "Usuário não encontrado.",
  USER_NOT_FOUND: "Usuário não encontrado.",
  "Failed to create user": "Não foi possível criar o usuário.",
  FAILED_TO_CREATE_USER: "Não foi possível criar o usuário.",
  "Failed to create session": "Não foi possível criar a sessão.",
  FAILED_TO_CREATE_SESSION: "Não foi possível criar a sessão.",
  "Failed to update user": "Não foi possível atualizar o usuário.",
  FAILED_TO_UPDATE_USER: "Não foi possível atualizar o usuário.",
  "Failed to get session": "Não foi possível obter a sessão.",
  FAILED_TO_GET_SESSION: "Não foi possível obter a sessão.",
  "Session expired": "Sessão expirada. Faça login novamente.",
  SESSION_EXPIRED: "Sessão expirada. Faça login novamente.",
  "Credential account not found": "Conta de credenciais não encontrada.",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Conta de credenciais não encontrada.",
  "Account not found": "Conta não encontrada.",
  ACCOUNT_NOT_FOUND: "Conta não encontrada.",
  "Email can not be updated": "O e-mail não pode ser atualizado.",
  EMAIL_CAN_NOT_BE_UPDATED: "O e-mail não pode ser atualizado.",
  "Failed to get user info": "Não foi possível obter as informações do usuário.",
  FAILED_TO_GET_USER_INFO: "Não foi possível obter as informações do usuário.",
  "User email not found": "E-mail do usuário não encontrado.",
  USER_EMAIL_NOT_FOUND: "E-mail do usuário não encontrado.",
  "Too many attempts": "Muitas tentativas. Tente novamente mais tarde.",
  "Invalid code": "Código inválido.",
  INVALID_CODE: "Código inválido.",
  "OTP has expired": "O código expirou.",
  OTP_HAS_EXPIRED: "O código expirou.",
  "Two factor authentication not enabled":
    "Autenticação em duas etapas não habilitada.",
  TWO_FACTOR_NOT_ENABLED: "Autenticação em duas etapas não habilitada.",
  "TOTP not enabled": "Autenticador não habilitado.",
  TOTP_NOT_ENABLED: "Autenticador não habilitado.",
  "Invalid backup code": "Código de backup inválido.",
  INVALID_BACKUP_CODE: "Código de backup inválido.",
  "Failed to authenticate": "Falha na autenticação.",
  FILE_SIZE_TOO_LARGE: "Arquivo muito grande.",
  INVALID_FILE_TYPE: "Tipo de arquivo inválido.",
  INVALID_FILE_EXTENSION: "Extensão de arquivo inválida.",
  FILE_BUFFER_NOT_FOUND: "Não foi possível processar o arquivo.",
  FILE_NOT_FOUND: "Arquivo não encontrado.",
  BANNER_NOT_FOUND: "Banner não encontrado.",
};

export function translateError(message: string): string {
  if (!message) return message;

  const normalized = message.toLowerCase();
  for (const [key, value] of Object.entries(errorMap)) {
    if (normalized.includes(key.toLowerCase())) return value;
  }

  return message;
}
