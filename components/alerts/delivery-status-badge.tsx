"use client";

type Props = {
    status: string | null;
};

export function DeliveryStatusBadge({ status }: Props) {
    if (!status) return <span className="text-gray-400 font-bold">N/A</span>;

    switch (status) {
        case "success":
            return <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Success</span>;
        case "failed_permanent":
            return <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase" title="Falha Definitiva">Failed Perm</span>;
        case "failed_retryable":
            return <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase" title="Tentará Denovo">Retryable</span>;
        case "pending":
            return <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">Pending</span>;
        default:
            return <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-[10px] font-bold uppercase">{status}</span>;
    }
}
