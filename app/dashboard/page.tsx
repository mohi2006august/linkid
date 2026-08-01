import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";
import CreateLinkId from "./CreateLinkId";
import QRCode from "./qrcode";
import type { Link } from "@prisma/client";

/**
 * Nest flat links array into a grouped structure.
 * Groups (isGroup=true) get a `children` array.
 */
function nestLinks(links: Link[]) {
    const childrenMap = new Map<string, Link[]>();
    const topLevel: Link[] = [];

    for (const link of links) {
        if (link.parentId) {
            const siblings = childrenMap.get(link.parentId) || [];
            siblings.push(link);
            childrenMap.set(link.parentId, siblings);
        } else {
            topLevel.push(link);
        }
    }

    return topLevel.map(link => {
        if (link.isGroup) {
            return { ...link, children: childrenMap.get(link.id) || [] };
        }
        return link;
    });
}

export default async function DashboardPage() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) redirect("/login");

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        include: { 
            links: { orderBy: [{ position: 'asc' }, { createdAt: 'asc' }] },
            subscribers: { orderBy: { createdAt: 'desc' } }
        },
    });

    if (!user?.username) return <CreateLinkId />;

    const nestedLinks = nestLinks(user.links);

    return (
        <DashboardClient
            username={user.username}
            initialLinks={nestedLinks}
            initialTheme={user.theme}
            initialLayout={user.layoutStyle}
            initialSeoTitle={user.seoTitle || ""}
            initialSeoDescription={user.seoDescription || ""}
            qrCode={<QRCode />} 
            enableEmailCapture={user.enableEmailCapture}
            subscribers={user.subscribers}
        />
    );
}

