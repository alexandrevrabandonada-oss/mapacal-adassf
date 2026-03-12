import type { NeighborhoodPriorityItem } from "@/lib/reports/get-neighborhood-priority-breakdown";

type NeighborhoodPriorityTableProps = {
  items: NeighborhoodPriorityItem[];
};

export function NeighborhoodPriorityTable({ items }: NeighborhoodPriorityTableProps) {
  const sortedItems = [...items].sort((a, b) => b.priority_score - a.priority_score);

  return (
    <section className="border-2 border-[var(--ink)] bg-white p-4 md:col-span-2">
      <h3 className="text-xs font-black uppercase tracking-[0.12em]">Ranking territorial por prioridade</h3>
      <p className="mt-2 text-sm text-zinc-700">
        Ordenacao por indice de prioridade. Use como leitura inicial para puxar incidencia, mutirao e fiscalizacao.
      </p>

      <div className="mt-3 overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-[var(--ink)] text-left text-xs uppercase tracking-[0.08em]">
              <th className="px-2 py-2">Bairro</th>
              <th className="px-2 py-2">Prioridade</th>
              <th className="px-2 py-2">Publicados</th>
              <th className="px-2 py-2">Verificados</th>
              <th className="px-2 py-2">Blocked</th>
              <th className="px-2 py-2">Bad</th>
              <th className="px-2 py-2">Good</th>
              <th className="px-2 py-2">Com foto</th>
            </tr>
          </thead>
          <tbody>
            {sortedItems.map((item) => (
              <tr key={item.neighborhood} className="border-b border-zinc-300">
                <td className="px-2 py-2 font-semibold">{item.neighborhood}</td>
                <td className="px-2 py-2 font-black">{item.priority_score.toFixed(1)}</td>
                <td className="px-2 py-2">{item.total_published}</td>
                <td className="px-2 py-2">{item.total_verified}</td>
                <td className="px-2 py-2">{item.total_blocked}</td>
                <td className="px-2 py-2">{item.total_bad}</td>
                <td className="px-2 py-2">{item.total_good}</td>
                <td className="px-2 py-2">{item.with_photo}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
