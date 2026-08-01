import { ProfileLinkItem } from "./ProfileLinkItem";
import { ProfileLinkGroup } from "./ProfileLinkGroup";
import { EmptyProfileState } from "./EmptyProfileState";
import { ProfileLinksProps } from "./types/type";

export function ProfileLinks({
    links,
    username,
    isOwner,
    layoutStyle,
}: ProfileLinksProps) {
    const safeLinks = links ?? [];

    if (safeLinks.length === 0) {
        return <EmptyProfileState isOwner={isOwner} />;
    }

    const isGrid = layoutStyle === "GRID";

    return (
        <div className="space-y-3">
            {safeLinks.map((item) => {
                if (item.isGroup) {
                    return (
                        <ProfileLinkGroup
                            key={item.id}
                            group={item}
                            username={username}
                            layoutStyle={layoutStyle}
                        />
                    );
                }

                // Top-level (ungrouped) links
                if (isGrid) {
                    return (
                        <div key={item.id} className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <ProfileLinkItem
                                link={item}
                                username={username}
                                layoutStyle={layoutStyle}
                            />
                        </div>
                    );
                }

                return (
                    <ProfileLinkItem
                        key={item.id}
                        link={item}
                        username={username}
                        layoutStyle={layoutStyle}
                    />
                );
            })}
        </div>
    );
}
