import './main.scss';

export class App {
    private readonly master = 'assets/media/main/gamemode_ancient_relic.png';
    private readonly saveKey = 'is-summary';

    private isSummary = false;
    private tooltips: TippyTooltip[] = [];
    // @ts-ignore // TODO: TYPES
    private realm = game.defaultRealm;

    constructor(private readonly context: Modding.ModContext) {}

    public async init() {
        this.context.onModsLoaded(() => {
            // @ts-ignore // TODO: TYPES
            this.context.patch(AncientRelicsMenuElement, 'showAncientRelics').after(() => {
                if (!game.currentGamemode.allowAncientRelicDrops) {
                    return;
                }

                const modal = document.querySelector('#modal-ancient-relics .block-content');

                if (!modal) {
                    return;
                }

                this.render(modal, this.realm);
            });
        });

        this.context.onInterfaceReady(() => {
            if (!game.currentGamemode.allowAncientRelicDrops) {
                return;
            }

            this.isSummary = this.context.characterStorage.getItem(this.saveKey) ?? false;

            const modal = document.querySelector('#modal-ancient-relics .block-content');

            if (!modal) {
                return;
            }

            const header = document.querySelector('#modal-ancient-relics .block-header .dropdown');

            if (header) {
                const switchButton = createElement('button', {
                    className: 'btn btn-secondary',
                    attributes: [['type', 'button']],
                    text: this.isSummary ? 'Hide Summary' : 'Show Summary'
                });

                switchButton.onclick = () => {
                    this.isSummary = !this.isSummary;
                    this.context.characterStorage.setItem(this.saveKey, this.isSummary);
                    switchButton.textContent = this.isSummary ? 'Hide Summary' : 'Show Summary';

                    this.toggleElements(modal);
                };

                header.prepend(switchButton);
            }
        });
    }

    // @ts-ignore // TODO: TYPES
    private render(modal: Element, realm: Realm) {
        this.realm = realm;
        const existing = document.getElementById('incy-wincy-ancient-relics');

        if (existing) {
            existing.remove();
        }

        for (const tooltip of this.tooltips) {
            tooltip.destroy();
        }

        this.tooltips = [];

        const container = createElement('div', { id: 'incy-wincy-ancient-relics' });

        // @ts-ignore // TODO: TYPES
        const realmSelect = createElement('realm-tab-select', { classList: ['d-block', 'w-100', 'mb-2'] });

        // @ts-ignore // TODO: TYPES
        realmSelect.setOptions(game.realms.allObjects, realm => {
            this.render(modal, realm);
        });

        container.append(realmSelect);

        for (const skill of game.skills.allObjects) {
            // @ts-ignore // TODO: TYPES
            if (!skill.hasAncientRelics) {
                continue;
            }

            // @ts-ignore // TODO: TYPES
            const relicSet = skill.ancientRelicSets.get(realm);

            if (relicSet) {
                const row = createElement('div', { id: skill.id, className: 'myth-relic-row' });

                for (const ancientRelic of relicSet.relicDrops) {
                    const relic = this.createRelic(skill, relicSet, ancientRelic.relic);
                    row.append(relic);
                }

                if (relicSet.completedRelic) {
                    const masterRelic = this.createRelic(skill, relicSet, relicSet.completedRelic);
                    row.append(masterRelic);
                }

                container.append(row);
            }
        }

        modal.append(container);

        this.toggleElements(modal);
    }

    private show(element: Element | undefined) {
        element?.classList.remove('d-none');
    }

    private hide(element: Element | undefined) {
        element?.classList.add('d-none');
    }

    private toggleElements(modal: Element) {
        if (this.isSummary) {
            this.show(document.querySelector('#incy-wincy-ancient-relics'));
            this.hide(modal.querySelector('.row'));
            this.hide(document.querySelector('#modal-ancient-relics .block-header .dropdown .dropdown-toggle'));
            document
                .querySelector('#modal-ancient-relics realm-tab-select')
                .setAttribute('style', 'display:none !important');
        } else {
            this.hide(document.querySelector('#incy-wincy-ancient-relics'));
            this.show(modal.querySelector('.row'));
            this.show(document.querySelector('#modal-ancient-relics .block-header .dropdown .dropdown-toggle'));
            document.querySelector('#modal-ancient-relics realm-tab-select').setAttribute('style', '');
        }
    }

    // @ts-ignore // TODO: TYPES
    private createRelic(skill: AnySkill, relicSet: AncientRelicSet, ancientRelic: AncientRelic) {
        const relic = createElement('div', {
            id: ancientRelic.id,
            className: `myth-relic${this.isUnlocked(relicSet, ancientRelic) ? ' unlocked' : ' locked'}`
        });

        relic.append(
            createElement('img', {
                attributes: [
                    ['src', this.isMasterRelic(relicSet, ancientRelic) ? this.master : skill.media],
                    ['height', '24'],
                    ['width', '24']
                ]
            })
        );

        this.tooltips.push(
            tippy(relic, {
                allowHTML: true,
                delay: 0,
                duration: 0,
                content: `
<div class="myth-ancient-relic-tooltip">
    <div>${ancientRelic.name}</div>
    <div class="mt-1">${
        this.isUnlocked(relicSet, ancientRelic) || this.isMasterRelic(relicSet, ancientRelic)
            ? // @ts-ignore // TODO: TYPES
              ancientRelic.stats.describeAsSpanHTML()
            : '???'
    }</div>
</div>
        `
            })
        );

        return relic;
    }

    // @ts-ignore // TODO: TYPES
    private isUnlocked(relicSet: AncientRelicSet, relic: AncientRelic) {
        if (this.isMasterRelic(relicSet, relic)) {
            // @ts-ignore // TODO: TYPES
            return relic.skill.hasMasterRelic(relicSet.realm);
        }

        return relicSet.foundRelics.get(relic) >= 1;
    }

    // @ts-ignore // TODO: TYPES
    private isMasterRelic(relicSet: AncientRelicSet, relic: AncientRelic) {
        return relicSet.completedRelic.id === relic.id;
    }
}
