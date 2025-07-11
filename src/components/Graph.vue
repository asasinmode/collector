<template>
   <div class="resultsContainer">
      <h2>results</h2>
      <div class="centered chart">
         <div class="graphSettingsContainer">
            <div class="modeButtonsContainer">
               <button class="button modeButton centered" @click="strikeType = 'average'" :class="{ selected: strikeType === 'average' }">average</button>
               <button class="button modeButton centered" @click="strikeType = 'nonCritical'" :class="{ selected: strikeType === 'nonCritical' }">non-critical</button>
               <button class="button modeButton centered" @click="strikeType = 'critical'" :class="{ selected: strikeType === 'critical' }">critical</button>
               <div class="modeButtonHighlight" :class="strikeType"/>
               <span class="strikeTooltip" v-if="showModeTooltips">choose the strike type, meaning graph will display damage of regular/critical/averaged strike</span>
            </div>
            <div class="modeButtonsContainer">
               <button class="button modeButton centered" @click="levelSetting = 'Equal'" :class="{ selected: levelSetting === 'Equal' }">equal</button>
               <button class="button modeButton centered" @click="levelSetting = 'SelectedChanging'" :class="{ selected: levelSetting === 'SelectedChanging' }">selected/changing</button>
               <button class="button modeButton centered" @click="levelSetting = 'ChangingSelected'" :class="{ selected: levelSetting === 'ChangingSelected' }">changing/selected</button>
               <div class="modeButtonHighlight" :class="levelSetting"/>
               <span class="levelTooltip" v-if="showModeTooltips">
                  choose the level setting the strike damage is shown for.<br/>
                  equal means 1-18 vs 1-18<br/>
                  selected vs changing means {{ level(true) }} vs 1-18<br/>
                  changing vs selected means 1-18 vs {{ level(false) }}
               </span>
            </div>
         </div>
         <div class="chartContainer">
            <canvas class="damageChart" ref="canvas"></canvas>
         </div>
      </div>
   </div>
</template>

<script>
import { defineComponent } from "vue";
import { mapState } from "pinia";
import { useMainStore } from "@/stores";
import Chart from 'chart.js/auto';
Chart.defaults.elements.point.radius = 4
Chart.defaults.elements.point.hoverRadius = 5.5;
const chartGridLineColor = 'hsla(0, 0%, 100%, 0.1)';
const chartGridTextColor = 'hsla(0, 0%, 100%, 0.6)';

export default defineComponent({
   name: 'Graph',
   data(){
      return {
         strikeType: "nonCritical",
         levelSetting: "Equal",
         graphColors: ["265, 100%, 65%", "120, 100%, 50%",  "0, 100%, 50%"],
         graphDPSColors: ["180, 100%, 50%", "60, 100%, 50%", "30, 100%, 50%"]
      }
   },
   mounted(){
      const labels = Array.from({ length: 18 }, (_, index) => index + 1)
      const data = {
         labels: labels,
         datasets: JSON.parse(JSON.stringify(this.datasetsToDisplay))
      }
      this.chart = new Chart(this.$refs.canvas, { type: 'line', data: data, options: {
         aspectRatio: (1 + Math.sqrt(5)) / 2,
         interaction: {
            mode: 'index',
            intersect: false,
         },
         scales: {
            x: {
               grid: { color: chartGridLineColor },
               ticks: { color: chartGridTextColor }
            },
            y: {
               grid: { color: chartGridLineColor },
               ticks: { color: chartGridTextColor }
            }
         },
         plugins: {
            legend: {
               labels: {
                  boxWidth: 15,
                  boxHeight: 15,
                  color: chartGridTextColor,
                  font: {
                     size: 14
                  },
               },
            },
            tooltip: {
               position: 'nearest',
               backgroundColor: 'hsla(0, 0%, 100%, 0.9)',
               titleColor: 'hsla(0, 0%, 0%, 1)',
               titleFont: {size: 14},
               bodyColor: 'hsla(0, 0%, 0%, 1)',
               bodyFont: {size: 12},
               callbacks: {
                  title: (context) => {
                     return this.levelSetting === "Equal" ? `${ context[0].label } lvl vs ${ context[0].label } lvl`
                     : this.levelSetting === "SelectedChanging" ? `${ this.level(true) } lvl vs ${ context[0].label } lvl`
                     : `${ context[0].label } lvl vs ${ this.level(false) } lvl`
                  }
               },
            }
         },
      } })
   },
   methods: {
      updateChart(){
         if(this.chart.data.datasets.length != this.datasetsToDisplay.length){
            this.chart.data.datasets = JSON.parse(JSON.stringify(this.datasetsToDisplay))
         } else{
            this.datasetsToDisplay.forEach((dataset, datasetIndex) => {
               this.chart.data.datasets[datasetIndex].data = dataset.data
            })
         }
         this.chart.update()
      },
      calculateDamage(mainStats, mainLevel, targetLevel){
         const mainItems = this.selectedItems(true)
         const modifiers = this.levelIndependentModifiers
         const [physicalOnHitDamage, magicalOnHitDamage] = this.onHitDamage(mainStats, mainLevel, mainItems)

         const mainHealth = mainStats.health[mainLevel - 1]
         const targetHealth = this.targetStats.health[targetLevel - 1]
         let percentageHealthDifference = (targetHealth - mainHealth) / 100
         percentageHealthDifference = percentageHealthDifference > 20 ? 20 : percentageHealthDifference < 0 ? 0 : percentageHealthDifference

         const physicalDamageModifier = mainItems.includes("3036") ? ((percentageHealthDifference * 0.0075) + 1) : 1

         const criticalDamageModifier = mainItems.includes("3124") ? 1 : mainStats.criticalStrike[1] / 100
         const criticalStrikeChance = mainStats.criticalStrike[0] / 100
         const averageDamageModifier = 1 + (criticalStrikeChance * criticalDamageModifier * modifiers.omen) - criticalStrikeChance

         const strikes = {
            nonCritical: {
               physicalDamage: mainStats.attackDamage[mainLevel - 1],
               magicDamage: mainStats.attackDamage[mainLevel - 1]
            },
            critical: {
               physicalDamage: mainStats.attackDamage[mainLevel - 1] * criticalDamageModifier * modifiers.omen,
               magicDamage: mainStats.attackDamage[mainLevel - 1] * criticalDamageModifier * modifiers.omen
            },
            average: {
               physicalDamage: mainStats.attackDamage[mainLevel - 1] * averageDamageModifier,
               magicDamage: mainStats.attackDamage[mainLevel - 1] * averageDamageModifier
            }
         }

         for(const type in strikes){
            strikes[type].physicalDamage *= modifiers.kalista * modifiers.corkiPhysical * modifiers.steelcaps
            strikes[type].magicDamage *= modifiers.corkiMagical * modifiers.steelcaps

            strikes[type].physicalDamage += physicalOnHitDamage
            strikes[type].magicDamage += magicalOnHitDamage

            strikes[type].physicalDamage *= physicalDamageModifier * modifiers.belVeth
            strikes[type].magicDamage *= modifiers.belVeth
         }

         let effectiveArmor = (this.targetStats.armor[targetLevel - 1] - (mainStats.armorPenetration[0] * (0.6 + (0.4 * mainLevel / 18)))) * (1 - (mainStats.armorPenetration[1] / 100))
         let effectiveMagicResists = (this.targetStats.magicResists[targetLevel - 1] - mainStats.magicPenetration[0]) * (1 - (mainStats.magicPenetration[1] / 100))

         effectiveArmor = effectiveArmor < 0 ? 0 : effectiveArmor
         effectiveMagicResists = effectiveMagicResists < 0 ? 0 : effectiveMagicResists

         return Object.keys(strikes).reduce((p, c) => {
            const { physicalDamage: preResistsPhysical, magicDamage: preResistsMagic } = strikes[c]

            const physicalDamage = preResistsPhysical * (100 / (100 + effectiveArmor))
            const magicDamage = preResistsMagic * (100 / (100 + effectiveMagicResists))
            const totalDamage = physicalDamage + magicDamage

            return Object.assign(p, {
               [c]: {
                  physicalDamage,
                  magicDamage,
                  totalDamage
               }
            })
         }, {})
      },
      selectedItems(isMain){
         return this.getSelectedItems(isMain)
      },
      calculateStat(base, level, growth){
         return base + (growth * (level - 1) * (0.7025 + (0.0175 * (level - 1))))
      },
      champion(isMain){
         return isMain ? this.getMainChampion : this.getTargetChampion
      },
      isRanged(isMain){
         return this.champion(isMain).stats.attackrange > 325
      },
      level(isMain){
         return this.getLevel(isMain)
      },
      onHitDamage(stats, level, items){ // [physical, magic]
         const bonusAttackDamage = stats.attackDamage[level - 1] - this.calculateStat(this.getMainChampion.stats.attackdamage, level, this.getMainChampion.stats.attackdamageperlevel)

         const championPassiveWarwickOnHit = this.getMainChampion.id === "Warwick" ? (10 + (2 * level)) + (bonusAttackDamage * 0.15) + (stats.abilityPower[level - 1] * 0.1) : 0  // warwick passive bonus magical damage on hit
         const championPassiveRammusOnHit = this.getMainChampion.id === "Rammus" ? (10 + (0.1 * stats.armor[level - 1])) : 0

         const onHitGuinsoo = Math.floor(stats.criticalStrike[0] / 5) * (items.includes("3124") ? 40 : items.includes("6677") ? 35 : 0) / 4

         const onHitTitanic = items.includes("3748") ? ((this.isRanged(true) ? 3 : 4) + (stats.health[level - 1] * (this.isRanged(true) ? 0.01125 : 0.015))) : 0
         const onHitWitsEnd = items.includes("3091") ? ([15, 15, 15, 15, 15, 15, 15, 15, 25, 35, 45, 55, 65, 75, 76.25, 77.5, 78.75, 80])[level - 1] : 0
         const onHitNashorsTooth = items.includes("3115") ? 15 + (stats.abilityPower[level - 1] * 0.2) : 0
         const onHitMuramana = items.includes("3042") ? (stats.mana[level - 1] * 0.015) : 0

         const physicalDamage = onHitGuinsoo + onHitTitanic + (items.includes("1043") ? 15 : 0) + onHitMuramana
         const magicDamage = onHitWitsEnd + onHitNashorsTooth + championPassiveWarwickOnHit + championPassiveRammusOnHit
         return [physicalDamage, magicDamage]
      },
   },
   computed:{
      ...mapState(useMainStore, ["showModeTooltips", "getCalculatedStats", "mythics", "getMainChampion", "getTargetChampion", "getSelectedItems", "getItem", "getLevel"]),
      mainStats(){
         return this.getCalculatedStats(true)
      },
      targetStats(){
         return this.getCalculatedStats(false)
      },
      damageEqual(){ // damage at equal levels
         return this.mainStats.map(infoSet => {
            return Array.from({length: 18}, (_, level) => {
               return this.calculateDamage(infoSet.stats, level + 1, level + 1)[this.strikeType].totalDamage
            })
         })
      },
      damageSelectedChanging(){ // damage selected level vs changing
         return this.mainStats.map(infoSet => {
            return Array.from({length: 18}, (_, level) => {
               return this.calculateDamage(infoSet.stats, this.level(true), level + 1)[this.strikeType].totalDamage
            })
         })
      },
      damageChangingSelected(){ // damage changing level vs selected
         return this.mainStats.map(infoSet => {
            return Array.from({length: 18}, (_, level) => {
               return this.calculateDamage(infoSet.stats, level + 1, this.level(false))[this.strikeType].totalDamage
            })
         })
      },
      adequateLevel(){  // main champion's level based on selected graph setting
         return this.levelSetting === "SelectedChanging" ? this.level(true) : undefined
      },
      dpsDatasets(){ // array of dps datasets based on damage datasets
         return this.mainStats.map((infoSet, index) => {
            return {
               label: this.mainStats.length === 1 ? 'dps' : `${ infoSet.title } dps`,
               backgroundColor: `hsla(${ this.graphDPSColors[index] }, 1)`,
               borderColor: `hsla(${ this.graphDPSColors[index] }, 0.8)`,
               pointStyle: 'rectRot',
               borderCapStyle: 'round',
               borderWidth: 4,
               pointBorderWidth: 3,
               pointHoverBorderWidth: 4.5,
               pointBorderColor: `hsla(${this.graphDPSColors[index]}, 1)`,
               borderDash: [2, 6],
               data: this[`damage${this.levelSetting}`][index].map((value, valueIndex) => value * infoSet.stats.attackSpeed[this.adequateLevel !== undefined ? (this.adequateLevel - 1) : valueIndex])
            }
         })
      },
      datasetsToDisplay(){
         const damageDatasets = this.mainStats.map((infoSet, index) => {
            return {
               label: infoSet.title,
               backgroundColor: `hsla(${ this.graphColors[index] }, 1)`,
               borderColor: `hsla(${ this.graphColors[index] }, 0.8)`,
               data: this[`damage${ this.levelSetting }`][index]
            }
         })
         return damageDatasets.reduce((previous, current, currentIndex) => [...previous, current, this.dpsDatasets[currentIndex]], [])
      },
      watchables(){
         return [this.strikeType, this.levelSetting, ...this.damageEqual[0], ...this.damageChangingSelected[0], ...this.damageSelectedChanging[0]]
      },
      levelIndependentModifiers(){
         const mainChampionId = this.champion(true).id
         const targetItems = this.selectedItems(false)
   
         return {
            omen: targetItems.includes("3143") ? 0.8 : 1,
            steelcaps: targetItems.includes("3047") ? 0.88 : 1,
            kalista: mainChampionId === "Kalista" ? 0.9 : 1,
            corkiPhysical: mainChampionId === "Corki" ? 0.2 : 1,
            corkiMagical: mainChampionId === "Corki" ? 0.8 : 0,
            belVeth: mainChampionId === "Belveth" ? 0.75 : 1,
         }
      }
   },
   watch: {
      watchables: {
         handler(){
            if(this.chart != undefined){
               this.updateChart()
            }
         },
         deep: true
      }
   }
})
</script>

<style scoped>
.resultsContainer{
   width: 100%;
   margin-bottom: 10em;
}
.resultsContainer > h2{
   padding-block: 1rem;
   text-align: center;
}
.chart{
   flex-direction: column;
}
.chartContainer{
   width: 100%;
}
.graphSettingsContainer{
   width: 100%;
   margin-bottom: 1em;
}
.modeButtonsContainer{
   width: 100%;
   position: relative;
   display: flex;
   flex-direction: row;
}
.modeButton{
   display: flex;
   width: calc(100% / 3);
   padding-inline: 1em;
   padding-block: 0.85em;
   font-size: 0.8rem;
   z-index: 1;
}
.modeButton:hover{
   background: var(--highlight1);
}
.modeButtonHighlight{
   position: absolute;
   width: calc(100% / 3);
   height: 100%;
   background: var(--highlight1);
   z-index: 0;
}
.modeButtonHighlight.average, .modeButtonHighlight.Equal{
   left: 0;
}
.modeButtonHighlight.nonCritical, .modeButtonHighlight.SelectedChanging{
   left: calc(100% / 3);
}
.modeButtonHighlight.critical, .modeButtonHighlight.ChangingSelected{
   left: calc(100% / 3 * 2);
}
.levelTooltip, .strikeTooltip{
   width: 16rem;
   margin-left: -8rem;
}
.levelTooltip{
   bottom: 220%;
}
.modeButtonsContainer:hover .levelTooltip, .modeButtonsContainer:hover .strikeTooltip{
   visibility: visible;
}
@media (min-width: 768px) {
   .chartContainer, .graphSettingsContainer{
      width: 48rem;
   }
   .modeButton{
      font-size: 1rem;
      padding-block: 0.7em;
   }
   .levelTooltip, .strikeTooltip{
      width: 20rem;
      margin-left: -10rem;
   }
}
</style>
