export function AlertMethodologyNote() {
    return (
        <div className="rounded-lg bg-zinc-50 p-4 border border-zinc-200 text-sm text-zinc-700">
            <h4 className="font-bold text-zinc-900 mb-2">Como os Alertas funcionam?</h4>
            <p className="mb-2 text-sm text-zinc-700">
          O sistema de alertas monitora o ritmo de problemas que chegam, não a veracidade in loco. 
          Um &quot;Alerta Vermelho&quot; significa que muitas pessoas estão reportando um problema grave 
          num curto espaço de tempo e ele está furando o &quot;volume morto&quot; esperado.
        </p>
            <p className="mb-2">
                <strong className="text-zinc-900">Importante:</strong> Alertas indicam locais ou situacoes que estao recebendo <em>mais atencao da populacao subitamente</em>. Eles <strong>nao implicam prova de causalidade</strong> (ex: nao garantem que a prefeitura quebrou a calcada ontem, mas sim que ha uma explosao de queixas sobre um fator especifico desde o ultimo periodo).
            </p>
            <p>
             Isso evita a ilusão de que a cidade &apos;piorou do nada&apos; apenas porque uma campanha de 
          mapeamento intensivo foi feita num fim de semana.
        </p>
        </div>
    );
}
