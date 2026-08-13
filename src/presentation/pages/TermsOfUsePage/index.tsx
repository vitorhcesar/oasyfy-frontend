import { AuthBrandMark } from "@/presentation/components/auth/AuthBrandMark";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const sections = [
  {
    title: "1. Aceitação dos Termos",
    body: "Ao criar uma conta e utilizar a plataforma Oasyfy, você declara ter lido, compreendido e aceito integralmente estes Termos de Uso. Caso não concorde com qualquer disposição, não utilize os serviços.",
  },
  {
    title: "2. Descrição do Serviço",
    body: "A Oasyfy disponibiliza uma plataforma de gateway de pagamentos que permite a sellers receberem valores, gerenciarem transações, checkouts e demais funcionalidades relacionadas à intermediação de pagamentos digitais, observadas as regras e limites aplicáveis à sua conta.",
  },
  {
    title: "3. Cadastro e Conta",
    body: "Você se compromete a fornecer informações verdadeiras, completas e atualizadas no cadastro e no processo de verificação (KYC). É de sua responsabilidade manter a confidencialidade das credenciais de acesso e de todas as atividades realizadas em sua conta. A Oasyfy poderá solicitar documentos e dados adicionais para validação da identidade e da atividade comercial.",
  },
  {
    title: "4. Uso Adequado",
    body: "É vedado utilizar a plataforma para atividades ilícitas, fraudulentas, de lavagem de dinheiro, financiamento ao terrorismo, ou qualquer operação que viole a legislação brasileira ou políticas de adquirentes e instituições financeiras parceiras. A Oasyfy poderá suspender ou encerrar contas que violem estas regras.",
  },
  {
    title: "5. Taxas e Valores",
    body: "As taxas, tarifas e condições comerciais aplicáveis às operações serão informadas na plataforma ou em contrato específico. Você autoriza a retenção e o desconto das taxas devidas sobre os valores processados, conforme as condições vigentes para sua conta.",
  },
  {
    title: "6. Privacidade e Dados",
    body: "O tratamento de dados pessoais observa a Lei Geral de Proteção de Dados (LGPD) e demais normas aplicáveis. Ao utilizar a plataforma, você concorda com a coleta e o tratamento dos dados necessários à prestação do serviço, cumprimento de obrigações legais e prevenção a fraudes.",
  },
  {
    title: "7. Disponibilidade e Limitações",
    body: "A Oasyfy envida esforços para manter a plataforma disponível e segura, mas não garante funcionamento ininterrupto. Eventuais indisponibilidades, atrasos de liquidação ou limitações impostas por terceiros (adquirentes, bancos, provedores) não geram, por si só, direito a indenização.",
  },
  {
    title: "8. Propriedade Intelectual",
    body: "Marcas, logotipos, softwares, layouts e demais conteúdos da plataforma são de titularidade da Oasyfy ou de seus licenciadores. É proibida a reprodução, engenharia reversa ou uso não autorizado desses ativos.",
  },
  {
    title: "9. Alterações",
    body: "Estes Termos podem ser atualizados a qualquer momento. Alterações relevantes poderão ser comunicadas por e-mail ou por aviso na plataforma. O uso continuado dos serviços após a publicação das mudanças implica aceitação da versão atualizada.",
  },
  {
    title: "10. Contato",
    body: "Em caso de dúvidas sobre estes Termos de Uso, entre em contato pelo suporte disponível na plataforma ou pelo canal oficial informado no site da Oasyfy.",
  },
];

export default function TermsOfUsePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-4">
          <AuthBrandMark size="sm" variant="purple" />
          <Link
            to="/login/seller"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} />
            Voltar ao login
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Termos de Uso
        </h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Última atualização: 12 de agosto de 2026
        </p>

        <div className="mt-10 space-y-8">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="text-lg font-semibold text-foreground">
                {section.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {section.body}
              </p>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
