import { cn } from "@/presentation/utils/cn";

export const SIGNUP_STEPS = [1, 2, 3] as const;
export type TSignUpStep = (typeof SIGNUP_STEPS)[number];

const STEP_LABELS: Record<TSignUpStep, string> = {
  1: "Dados",
  2: "Telefone",
  3: "Senha",
};

interface ISignUpStepperProps {
  step: TSignUpStep;
}

export default function SignUpStepper({ step }: ISignUpStepperProps) {
  return (
    <nav
      aria-label="Progresso do cadastro"
      className="liquid-glass relative z-10 mb-3 rounded-[20px] px-5 py-4 sm:rounded-3xl sm:px-7"
    >
      <ol className="flex w-full items-start">
        {SIGNUP_STEPS.map((signupStep, index) => {
          const reached = signupStep <= step;
          const current = signupStep === step;
          const isLast = index === SIGNUP_STEPS.length - 1;

          return (
            <li
              key={signupStep}
              aria-current={current ? "step" : undefined}
              className={cn("flex items-start", isLast ? "shrink-0" : "flex-1")}
            >
              <div className="flex flex-col items-center gap-1.5">
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    reached
                      ? "bg-primary text-primary-foreground"
                      : "border border-white/20 bg-white/5 text-muted-foreground"
                  )}
                >
                  {signupStep}
                </span>
                <span
                  className={cn(
                    "whitespace-nowrap text-[11px] font-medium",
                    current
                      ? "text-foreground"
                      : reached
                        ? "text-primary"
                        : "text-muted-foreground"
                  )}
                >
                  {STEP_LABELS[signupStep]}
                </span>
              </div>

              {!isLast && (
                <span
                  aria-hidden
                  className={cn(
                    "mx-3 mt-[17px] h-px flex-1 rounded-full transition-colors",
                    signupStep < step ? "bg-primary" : "bg-white/15"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
