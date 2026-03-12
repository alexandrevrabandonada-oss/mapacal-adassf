import { listAlertEvents } from "@/lib/alerts/list-alert-events";
import { getPublicAlertById } from "@/lib/alerts/get-public-alert-by-id";
import { getAppBaseUrl, isSupabaseConfigured } from "@/lib/env";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { AlertCard } from "@/components/alerts/alert-card";
import { TopNav } from "@/components/top-nav";
import { SharePackDrawer } from "@/components/share/share-pack-drawer";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;

    if (!isSupabaseConfigured()) {
        return { title: 'Alerta não encontrado' };
    }

    const { alert: alertItem, ok } = await getPublicAlertById(id);

    if (!alertItem) {
        return { title: 'Alerta não encontrado' };
    }

    const cleanTitle = alertItem.title;
    const desc = alertItem.summary || `Alerta classificado como ${alertItem.severity.toUpperCase()} gerado em ${new Date(alertItem.created_at).toLocaleDateString("pt-BR")}.`;

    const baseUrl = getAppBaseUrl();

    return {
        title: cleanTitle,
        description: desc,
        openGraph: {
            title: cleanTitle,
            description: desc,
            url: `${baseUrl}/alertas/${id}`,
            siteName: "Mapa Calçadas SF",
            type: "article",
            // next/og gerenciará a config da imagem usando a rota opengraph-image.tsx
        },
        twitter: {
            card: "summary_large_image",
            title: cleanTitle,
            description: desc,
        }
    };
}

export default async function AlertaPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    if (!isSupabaseConfigured()) {
        return (
            <div className="p-8 text-center text-red-500">
                Banco de dados não configurado.
            </div>
        );
    }

    const { alert: alertItem, ok } = await getPublicAlertById(id);

    if (!alertItem) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-zinc-50 pb-20">
            <TopNav />
            <main className="mx-auto max-w-[800px] px-4 py-8">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 mb-8">
                    Detalhes do Alerta
                </h1>
                <div className="bg-white shadow-sm border rounded-lg p-6">
                    <AlertCard alert={alertItem} adminHref={false} />
                    
                    <div className="mt-8 pt-6 border-t border-zinc-100 flex items-center justify-between">
                        <div className="text-sm text-zinc-500">
                            Gostaria de compartilhar este alerta com sua comunidade?
                        </div>
                        <SharePackDrawer 
                            id={id} 
                            kind="alertas" 
                            className="bg-zinc-900 hover:bg-zinc-800" 
                        />
                    </div>
                </div>
            </main>
        </div>
    );
}
