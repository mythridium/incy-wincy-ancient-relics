import './main.scss';

export class App {
    private readonly master = 'assets/media/main/gamemode_ancient_relic.png';
    private readonly saveKey = 'is-summary';

    private isSummary = false;
    private tooltips: TippyTooltip[] = [];

    constructor(private readonly context: Modding.ModContext) {}

    public async init() {
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

                    this.render(modal);
                };

                header.prepend(switchButton);
            }

            this.context.patch(<any>Skill, 'onAncientRelicUnlock').after(() => {
                this.render(modal);
            });

            this.render(modal);
        });
    }

    private render(modal: Element) {
        const existing = document.getElementById('incy-wincy-ancient-relics');

        if (existing) {
            existing.remove();
        }

        for (const tooltip of this.tooltips) {
            tooltip.destroy();
        }

        this.tooltips = [];

        const container = createElement('div', { id: 'incy-wincy-ancient-relics' });

        for (const skill of game.skills.allObjects) {
            const row = createElement('div', { id: skill.id, className: 'myth-relic-row' });

            for (const ancientRelic of skill.ancientRelics) {
                const relic = this.createRelic(skill, ancientRelic.relic);
                row.append(relic);
            }

            const masterRelic = this.createRelic(skill, skill.completedAncientRelic);
            row.append(masterRelic);

            container.append(row);
        }

        modal.append(container);

        if (this.isSummary) {
            this.show(container);
            this.hide(modal.querySelector('.row'));
            this.hide(document.querySelector('#modal-ancient-relics .block-header .dropdown .dropdown-toggle'));
        } else {
            this.hide(container);
            this.show(modal.querySelector('.row'));
            this.show(document.querySelector('#modal-ancient-relics .block-header .dropdown .dropdown-toggle'));
        }
    }

    private show(element: Element | undefined) {
        element?.classList.remove('d-none');
    }

    private hide(element: Element | undefined) {
        element?.classList.add('d-none');
    }

    private createRelic(skill: AnySkill, ancientRelic: AncientRelic) {
        const relic = createElement('div', {
            id: ancientRelic.id,
            className: `myth-relic${this.isUnlocked(skill, ancientRelic) ? ' unlocked' : ' locked'}`
        });

        relic.append(
            createElement('img', {
                attributes: [
                    ['src', this.isMasterRelic(skill, ancientRelic) ? this.master : skill.media],
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
        this.isUnlocked(skill, ancientRelic) || this.isMasterRelic(skill, ancientRelic)
            ? describeModifierData(ancientRelic.modifiers)
            : '???'
    }</div>
</div>
        `
            })
        );

        return relic;
    }

    private isUnlocked(skill: AnySkill, relic: AncientRelic) {
        if (this.isMasterRelic(skill, relic)) {
            return (<any>skill).hasMasterRelic;
        }
        const count = skill.getAncientRelicCount(relic);
        return count >= 1;
    }

    private isMasterRelic(skill: AnySkill, relic: AncientRelic) {
        return skill.completedAncientRelic.id === relic.id;
    }
}
