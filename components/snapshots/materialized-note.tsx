import { SectionCard } from "@/components/section-card";

type Props = {
  type?: "snapshot" | "diff";
};

export function MaterializedNote({ type = "snapshot" }: Props) {
  if (type === "snapshot") {
    return (
      <SectionCard title="O que e um snapshot materializado?" eyebrow="Metodologia">
        <div className="space-y-3 text-sm text-zinc-700">
          <p>
            Um <strong>snapshot</strong> &eacute; uma fotografia congelada dos dados de uma data/hora espec&iacute;fica.
          </p>
          <p>
            Diferente dos <strong>comparativos m&oacute;veis</strong> (?days=30), que mudam conforme o tempo passa,
            um snapshot permanece est&aacute;vel e pode ser citado, compartilhado e revisitado depois.
          </p>
          <p className="text-xs text-zinc-600">
            Todo snapshot exibe explicitamente quando foi congelado e qual janela temporal foi usada para montagem.
          </p>
        </div>
      </SectionCard>
    );
  }

  // type === "diff"
  return (
    <SectionCard title="O que e um diff congelado?" eyebrow="Metodologia">
      <div className="space-y-3 text-sm text-zinc-700">
        <p>
          Um <strong>diff</strong> compara dois snapshots diferentes&mdash;por exemplo, estado A vs estado B.
        </p>
        <p>
          O diff <strong>n&atilde;o presume causalidade</strong>. &Eacute; apenas uma comparacao entre dois estados
          congelados. Se as fotos mostram uma piora, isso &eacute; fato observ&aacute;vel; n&atilde;o &eacute;
          necessariamente culpa ou cr&eacute;dito de ningu&eacute;m.
        </p>
        <p className="text-xs text-zinc-600">
          Use diffs congelados para: documenta&ccedil;&atilde;o hist&oacute;rica, relat&oacute;rios, anal&iacute;se
          de tend&ecirc;ncias, e argumenta&ccedil;&atilde;o honesta sobre o que mudou.
        </p>
      </div>
    </SectionCard>
  );
}
