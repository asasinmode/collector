<template>
<main>
   <h3>calculated stats</h3>
   <div class="baseStats centered">
      <div class="baseStatContainer centered" v-for="(stat, name) in filteredStats" :title="tooltipTitles[name] ? tooltipTitles[name] : ''" :key="stat.id">
         <label :class="{tooltipAvailable: tooltipTitles[name]}"><img :src="require(`@/assets/statIcons/${name}.webp`)">{{name}}</label>
         <div class="baseStat">
            {{stat}}
         </div>
      </div>
   </div>
</main>
</template>

<script>
export default {
   name: 'calculatedChampionInfo',
   props: ['isMain'],
   data(){
      return {
         jhinPassiveValues: [0.04, 0.05, 0.06, 0.07, 0.08, 0.09, 0.10, 0.11, 0.12, 0.14, 0.16, 0.2, 0.24, 0.28, 0.32, 0.36, 0.4, 0.44]
      }
   },
   methods: {
      sumValuesOf(array, statKey){
         array = array.map(item => this.$store.getters.getItem(item))
         return array.length ? array.map(element => element.stats[statKey] ? element.stats[statKey] : 0).reduce((previous, next) => previous + next) : 0
      },
      calculateArmorPen(array){
         const itemsLethality = array.length > 0 ? array.map(item => item.lethality).reduce((previous, next) => previous + next) : 0
         const itemsArmorPen = array.length > 0 ? Math.floor(array.map(item => item.percentage).reduce((previous, next) => previous + next) * 100) : 0
         return [
            itemsLethality + (this.legendaries(true).length * (this.$store.getters.getSelectedItems(true).includes("6693") ? 5 : 0)),
            itemsArmorPen + (this.legendaries(true).length * (this.$store.getters.getSelectedItems(true).includes("6692") ? 4 : 0)) + (this.legendaries(true).length * (this.$store.getters.getSelectedItems(true).includes("6632") ? 5 : 0))
         ]
      },
      calculateMagicPen(array){
         const itemsFlat = array.length > 0 ? array.map(item => item.flat).reduce((previous, next) => previous + next) : 0
         const itemsPercentage = array.length > 0 ? Math.floor(array.map(item => item.percentage).reduce((previous, next) => previous + next) * 100) : 0
         return [
            itemsFlat + (this.legendaries(true).length * ((this.$store.getters.getSelectedItems(true).includes("3152") || this.$store.getters.getSelectedItems(true).includes("6655")) ? 5 : 0)),
            itemsPercentage + (this.legendaries(true).length * (this.$store.getters.getSelectedItems(true).includes("6632") ? 5 : 0))
         ]
      },
      calculateStat(base, level, growth){
         return base + (growth * (level - 1) * (0.7025 + (0.0175 * (level - 1))))
      },
      critChance(items){
         const chance = Math.round(this.sumValuesOf(items, "FlatCritChanceMod") * 100 * ((this.champion.id === "Yasuo" || this.champion.id === "Yone") ? 2.5 : 1))
         return [
            chance < 100 ? chance : 100,        // crit chance
            chance - 100 > 0 ? !(items.includes("3124") || items.includes("6677")) ? chance - 100 : 0 : 0 // crit chance over 100%
         ]
      },
      critDamage(items){
         const damage = 175 + (items.includes("3031") && this.critChance(items)[0] >= 60 ? 35 : 0)  // infinity edge
         return damage * (this.champion.id === "Jhin" ? 0.86 : 1) * ((this.champion.id === "Yasuo" || this.champion.id === "Yone") ? 0.9 : 1)   // jhin, yasuo/yone
      },
      legendaries(isMain){
         return this.$store.getters.getSelectedItems(isMain).filter(item => (!this.mythics.includes(item) && this.$store.getters.getItem(item).gold.total >= 1600) || item === "3112" || item === "2051" || item === "3184" || item === "3177")
      },
      calculateStats(items){
         const calculated = {
            attackDamage: undefined,
            abilityPower: undefined,
            attackSpeed: undefined,
            armorPenetration: undefined,
            magicPenetration: undefined,
            criticalStrike: undefined,
            health: undefined,
            armor: undefined,
            magicResists: undefined
         }
         const miniRuneAttackSpeed = 0.1, miniRuneArmor = 6

         let itemsHealth = this.sumValuesOf(items, "FlatHPPoolMod")
         let mythicPassiveHealth = this.legendaries(this.isMain).length * (items.includes("6662") ? 100 : 0) + this.legendaries(this.isMain).length * ((items.includes("6664") || items.includes("3068")) ? 50 : items.includes("6673") ? 70 : 0)  // frostfire gauntlet / sunfire aegis and turbochemtank / immortal shieldbow mythic passives
         let bonusMana = this.sumValuesOf(items, "FlatMPPoolMod")
         let bonusHealth = itemsHealth + mythicPassiveHealth

         if(this.champion.id === "Vladimir"){   // i love vladimir
            let itemsAbilityPower = this.sumValuesOf(items, "FlatMagicDamageMod")
            let mythicPassiveAbilityPower = this.legendaries(this.isMain).length * (items.includes("4005") ? 15 : 0) + this.legendaries(this.isMain).length * (items.includes("6656") ? 10 : 0) + this.legendaries(this.isMain).length * (items.includes("4633") ? 8 : 0) // ad from everfrost/imperial mandate/riftmaker mythic passive
            let dreadAbilityPower = items.includes("3041") ? 125 : 0
            let crimsonPactBonusAbilityPower = bonusHealth / 30
            let abilityPowerModifier = 1 + (items.includes("3089") ? 0.35 : 0)
            let bonusAbilityPower = (itemsAbilityPower + mythicPassiveAbilityPower + crimsonPactBonusAbilityPower) * abilityPowerModifier

            let itemsAttackDamage = this.sumValuesOf(items, "FlatPhysicalDamageMod")
            let mythicPassiveAttackDamage = this.legendaries(this.isMain).length * (items.includes("6673") ? 5 : 0) + this.legendaries(this.isMain).length * (items.includes("3078") ? 3 : 0) // ad from shieldbow/trinity mythic passive
            let titanicAttackDamage = items.includes("3748") ? (itemsHealth + mythicPassiveHealth) * 0.02 : 0 // ad from titanic hydra passive
            let bonusAttackDamage = itemsAttackDamage + mythicPassiveAttackDamage + titanicAttackDamage  // needed for adaptive force calculation

            let miniRuneAbilityPower = (bonusAbilityPower > 0 && (bonusAttackDamage + 5.4) < (bonusAbilityPower + (9 * abilityPowerModifier))) ? 9 : 0

            bonusAbilityPower += miniRuneAbilityPower * abilityPowerModifier

            var crimsonPactBonusHealth = ((bonusAbilityPower + (dreadAbilityPower * abilityPowerModifier)) - Math.floor(crimsonPactBonusAbilityPower)) * 1.6   // for some reason rounding it down works :)
            let darkPactAbilityPower = items.includes("4637") ? ((bonusHealth + crimsonPactBonusHealth) * 0.02) : 0   // initial demonic embrace

            let crimsonPactBonusHealthBeforeEmbrace = crimsonPactBonusHealth
            crimsonPactBonusHealth += darkPactAbilityPower * abilityPowerModifier * 1.6
            let darkPactAbilityPowerBeforeCrimsonPact = darkPactAbilityPower
            darkPactAbilityPower += items.includes("4637") ? (crimsonPactBonusHealth - crimsonPactBonusHealthBeforeEmbrace) * 0.02 : 0
            crimsonPactBonusHealth += (darkPactAbilityPower - darkPactAbilityPowerBeforeCrimsonPact) * abilityPowerModifier * 1.6
         } else {
            var crimsonPactBonusHealth = 0
         }
         bonusHealth += crimsonPactBonusHealth

         let livingForgeHealthModifier = this.champion.id === "Ornn" ? items.find(item => this.mythics.includes(item)) ? 1.14 : 1.1 : 1  // ornn passive
         const health = Array.from({length: 18}, (_, level) => {
            let maxMana = this.calculateStat(this.champion.stats.mp, level + 1, this.champion.stats.mpperlevel) + bonusMana
            let healthFromLevel = this.calculateStat(this.champion.stats.hp, level + 1, this.champion.stats.hpperlevel)
            let aweHealth = ((items.includes("3119") || items.includes("3121")) && this.champion.partype === "Mana" ? maxMana * 0.08 : 0)   // health from winter's approach/fimbulwinter awe passive
            return this.champion.id !== "Pyke" ? Math.round(healthFromLevel + ((bonusHealth + aweHealth) * livingForgeHealthModifier)) : Math.round(healthFromLevel)
         })

         calculated.health = health

         if(this.isMain){
            const [lethality, percentPen] = this.calculateArmorPen(this.$store.getters.filterArmorPenItems(items))
            const [flatMagicPen, percentMagicPen] = this.calculateMagicPen(this.$store.getters.filterMagicPenItems(items))

            let itemsAttackSpeed = this.sumValuesOf(items, "PercentAttackSpeedMod") + this.legendaries(true).length * (items.includes("6672") ? 0.1 : 0)  // all items + kraken slayer mythic passive
            let attackSpeedRatio = (this.$store.getters.getASRatioChampions.find(champion => champion[0] == this.champion.id) ? this.$store.getters.getASRatioChampions.find(champion => champion[0] == this.champion.id)[1] : 1)
            const attackSpeed = this.isMain ? this.champion.id === "Jhin" ? Array.from({length: 18}, (_, level) => {return parseFloat((((3 / 100) * level * (0.7025 + (0.0175 * level)) + 1) * this.champion.stats.attackspeed).toFixed(3))}) // jhin is a special cookie
               : Array.from({length: 18}, (_, level) => {
                  let attackSpeedFromLevel = (this.champion.stats.attackspeedperlevel / 100) * (level) * (0.7025 + (0.0175 * (level)))
                  return parseFloat((this.champion.stats.attackspeed * ((attackSpeedFromLevel + itemsAttackSpeed + miniRuneAttackSpeed) * attackSpeedRatio + 1)).toFixed(3))
               }).map(attackSpeed => attackSpeed > 2.5 ? 2.5 : attackSpeed) : undefined
            
            let itemsAttackDamage = this.sumValuesOf(items, "FlatPhysicalDamageMod")
            let mythicPassiveAttackDamage = this.legendaries(true).length * (items.includes("6673") ? 5 : 0) + this.legendaries(true).length * (items.includes("3078") ? 3 : 0) // ad from shieldbow/trinity mythic passive
            let wandererPassiveAttackDamage = (this.champion.id === "Yasuo" || this.champion.id === "Yone") ? this.critChance(items)[1] * 0.4 : 0   // ad from yone/yasuo passive

            let itemsAbilityPower = this.sumValuesOf(items, "FlatMagicDamageMod")
            let mythicPassiveAbilityPower = this.legendaries(this.isMain).length * (items.includes("4005") ? 15 : 0) + this.legendaries(this.isMain).length * (items.includes("6656") ? 10 : 0) + this.legendaries(this.isMain).length * (items.includes("4633") ? 8 : 0) // ad from imperial mandate/everfrost/riftmaker mythic passive
            let crimsonPactBonusAbilityPower = this.champion.id === "Vladimir" ? (itemsHealth + mythicPassiveHealth) / 30 : 0  // did i mention vladimir is my favourite champion?

            let dreadAbilityPower = items.includes("3041") ? 125 : 0
            let abilityPowerModifier = 1 + (items.includes("3089") ? 0.35 : 0)

            const attackDamage = [], abilityPower = []
            for(let level = 1; level <= 18; level++){
               let maxMana = this.calculateStat(this.champion.stats.mp, level, this.champion.stats.mpperlevel) + bonusMana
               let aweHealth = (items.includes("3119") || items.includes("3121")) && this.champion.partype === "Mana" ? maxMana * 0.08 : 0

               let titanicAttackDamage = this.champion.id !== "Pyke" ? items.includes("3748") ? (itemsHealth + mythicPassiveHealth + aweHealth) * 0.02 : 0 : 0 // ad from titanic hydra passive, pyke gets none :(
               let aweAttackDamage = ((items.includes("3004") || items.includes("3042")) && this.champion.partype === "Mana" ? maxMana * 0.025 : 0)   // ad from manamune/muramana awe passive
               let attackDamageFromLevel = this.calculateStat(this.champion.stats.attackdamage, level, this.champion.stats.attackdamageperlevel)
               let whisperAttackDamageModifier = this.champion.id === "Jhin" ? 1 + (this.jhinPassiveValues[level - 1] + (0.25 * (itemsAttackSpeed + miniRuneAttackSpeed)) + (this.critChance(items)[0] * (items.includes("3124") ? 0 : 0.003))) : 1   // jhin passive modifier
               let giftOfTheDrownedOnesAttackDamage = this.champion.id === "Pyke" ? (itemsHealth + mythicPassiveHealth + aweHealth) / 14 : 0   // ad from pyke passive
               let bonusAttackDamage = whisperAttackDamageModifier * (itemsAttackDamage + aweAttackDamage + mythicPassiveAttackDamage + titanicAttackDamage + wandererPassiveAttackDamage + giftOfTheDrownedOnesAttackDamage)  // needed for adaptive force calculation
               
               // let aweAbilityPower = ((items.includes("3003") && this.champion.partype === "Mana") ? 0.03 : (items.includes("3003") && this.champion.partype === "Mana") ? 0.05 : 0) * bonusMana
               let aweAbilityPower = 0 // 11.23.1 seraph/archangel changes
               let darkPactAbilityPower = items.includes("4637") ? ((bonusHealth + aweHealth) * 0.02) : 0   // demonic embrace passive
               // console.log("demonic embrace ap", darkPactAbilityPower)
               let calculatedAbilityPower = (itemsAbilityPower + mythicPassiveAbilityPower + crimsonPactBonusAbilityPower + aweAbilityPower + darkPactAbilityPower) * abilityPowerModifier

               let miniRuneAbilityPower = (calculatedAbilityPower > 0 && (bonusAttackDamage + (5.4 * whisperAttackDamageModifier)) < (calculatedAbilityPower + (9 * abilityPowerModifier))) ? 9 : 0
               let miniRuneAttackDamage = miniRuneAbilityPower === 0 ? (5.4 * whisperAttackDamageModifier) : 0

               const totalAttackDamage = (attackDamageFromLevel * whisperAttackDamageModifier) + bonusAttackDamage + miniRuneAttackDamage
               const totalAbilityPower = calculatedAbilityPower + ((miniRuneAbilityPower + dreadAbilityPower) * abilityPowerModifier)

               attackDamage.push(totalAttackDamage); abilityPower.push(totalAbilityPower)
            }

            calculated.attackDamage = attackDamage
            calculated.abilityPower = abilityPower
            calculated.attackSpeed = attackSpeed
            calculated.armorPenetration = [lethality, percentPen]
            calculated.magicPenetration = [flatMagicPen, percentMagicPen]
            calculated.criticalStrike = [this.critChance(items)[0], this.critDamage(items)]
         } else{
            let itemsArmor = this.sumValuesOf(items, "FlatArmorMod")
            let mythicPassiveArmor = this.legendaries(false).length * (items.includes("3001") ? 5 : 0)
            let livingForgeArmorModifier = this.champion.id === "Ornn" ? items.find(item => this.mythics.includes(item)) ? 1.14 : 1.1 : 1
            const armor = Array.from({length: 18}, (_, level) => {
               let armorFromLevel = this.calculateStat(this.champion.stats.armor, level + 1, this.champion.stats.armorperlevel)
               return armorFromLevel + ((itemsArmor + miniRuneArmor + mythicPassiveArmor) * livingForgeArmorModifier)
            })

            let itemsMagicResists = this.sumValuesOf(items, "FlatSpellBlockMod")
            let mythicPassiveMagicResists = this.legendaries(false).length * (items.includes("3001") ? 5 : 0)
            let livingForgeMagicResistsModifier = this.champion.id === "Ornn" ? items.find(item => this.mythics.includes(item)) ? 1.14 : 1.1 : 1
            const magicResists = Array.from({length: 18}, (_, level) => {
               let magicResistsFromLevel = this.calculateStat(this.champion.stats.spellblock, level + 1, this.champion.stats.spellblockperlevel)
               return magicResistsFromLevel + ((itemsMagicResists + mythicPassiveMagicResists) * livingForgeMagicResistsModifier)
            })

            calculated.armor = armor
            calculated.magicResists = magicResists
         }
         return calculated
      }
   },
   computed:{
      selectedItems(){
         return this.$store.getters.getSelectedItems(this.isMain)
      },
      allItems(){
         return this.$store.getters.getAllItems
      },
      mythics(){
         return this.$store.getters.getMythics
      },
      armorPenItems(){
         return this.$store.getters.getArmorPenItems
      },
      level(){
         return this.$store.getters.getLevel(this.isMain)
      },
      champion(){
         return this.isMain ? this.$store.getters.getMainChampion : this.$store.getters.getTargetChampion
      },
      baseStats(){
         let calculated = {...this.calculateStats(this.selectedItems)}

         if(this.isMain){  // multiple item sets to compare
            var secondItemset = ((this.selectedItems.includes("3036") || this.selectedItems.includes("6676")) && !(this.selectedItems.includes("3036") && this.selectedItems.includes("6676"))) ?
               this.selectedItems.filter(item => item != "3036" && item != "6676")
               : undefined
            if(secondItemset != undefined){
               secondItemset.push(this.selectedItems.includes("3036") ? "6676" : "3036")
               this.$store.commit('setCalculatedStats', {stats: [{stats: {...calculated}, items: this.selectedItems, title: this.selectedItems.includes("3036") ? "ldr" : "collector"}, {stats: {...this.calculateStats(secondItemset)}, items: secondItemset, title: this.selectedItems.includes("3036") ? "collector" : "ldr"}], isMain: this.isMain})
            } else{
               this.$store.commit('setCalculatedStats', {stats: [{stats: {...calculated}, items: this.selectedItems, title: "damage"}], isMain: this.isMain})
            }
         } else{
            this.$store.commit('setCalculatedStats', {stats: {...calculated}, isMain: this.isMain})
         }
         
         if(this.isMain){
            calculated.attackDamage = Math.round(calculated.attackDamage[this.level - 1])
            if(this.apVisibility){
               calculated.abilityPower = Math.round(calculated.abilityPower[this.level - 1])
            } else{
               delete calculated.abilityPower
            }
            calculated.armorPenetration = `${calculated.armorPenetration[0]} | ${calculated.armorPenetration[1]}%`
            if(this.apVisibility){
               calculated.magicPenetration = `${calculated.magicPenetration[0]} | ${calculated.magicPenetration[1]}%`
            } else{
               delete calculated.magicPenetration
            }
            delete calculated.health
            calculated.criticalStrike = `${calculated.criticalStrike[0]}% | ${calculated.criticalStrike[1]}%`
            calculated.attackSpeed = calculated.attackSpeed[this.level - 1]
         } else{
            calculated.health = calculated.health[this.level - 1]
            calculated.armor = Math.round(calculated.armor[this.level - 1])
            calculated.magicResists = Math.round(calculated.magicResists[this.level - 1])
         }

         return calculated
      },
      tooltipTitles(){
         return {
            armorPenetration: "lethality | armor penetration",
            criticalStrike: "critical strike chance | critical strike damage"
         }
      },
      filteredStats(){
         return Object.keys(this.baseStats).filter(key => {
               return this.baseStats[key] != undefined
         }).reduce((obj, key) => {return {...obj, [key]: this.baseStats[key]}}, {})
      },
      apVisibility(){
         return this.$store.getters.getApVisibility
      }
   }
}
</script>

<style scoped>
main h3{
   text-align: center;
   padding-bottom: 0.25em;
}
.baseStats{
   display: flex;
   flex-direction: column;
   flex-wrap: wrap;
}
.baseStatContainer{
   flex-direction: column;
   padding-bottom: 0.5em;
}
.baseStatContainer label{
   display: flex;
   align-items: center;
   justify-content: center;
   font-weight: bold;
   color: var(--accent1);
   padding-bottom: 0.2em;
}
.baseStatContainer label.tooltipAvailable{
   cursor: help;
}
.baseStatContainer label img{
   width: 17px;
   height: 17px;
   margin-right: 0.5em;
   filter: saturate(0) brightness(10);
}
@media (min-width: 768px) {
   .baseStats{
      flex-direction: row;
   }
   .baseStatContainer{
      /* width: calc(50% - 2em); */
      margin-inline: 1em;
   }
}
/* @media (min-width: 1152px){
   .baseStatContainer{
      width: calc(33% - 2em);
   }
   .baseStats{
      padding-inline: 9%;
   }
} */
</style>