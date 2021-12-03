<template>
   <div id="app">
      <championSelector />
      <championComparison />
      <results v-if="showResults" />
   </div>
</template>

<script>
import championSelector from "@/components/championSelector.vue"; import championComparison from '@/components/championComparison.vue'; import results from '@/components/results.vue'
export default {
   name: 'App',
   components: {
      championSelector, championComparison, results
   },
   mounted(){
      if(localStorage.getItem('tooltipsVisibility') != "null"){
         this.$store.commit('setShowModeTooltips', localStorage.getItem('tooltipsVisibility'))
      } else{
         localStorage.setItem('tooltipsVisibility', this.$store.getters.getShowModeTooltips)
      }
   },
   computed: {
      showResults(){
         return this.$store.getters.getMainChampion != undefined && this.$store.getters.getTargetChampion != undefined && this.$store.getters.getCalculatedStats(true)[0].stats.attackDamage != undefined && this.$store.getters.getCalculatedStats(false).armor != undefined
      }
   }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Roboto&display=swap');
:root{
   --bg1: hsl(0, 0%, 0%);
   --main1: hsl(0, 0%, 100%);
   --main2: hsl(0, 0%, 80%);
   --accent1: hsla(265, 100%, 65%, 1);
   --highlight1: hsla(0, 100%, 100%, 0.1);
   --highlight2: hsla(0, 100%, 100%, 0.25);
   --lowlight1: hsla(0, 0%, 0%, 0.3);
   --border-inactive: hsl(0, 0%, 75%);
   --border-active: hsl(0, 0%, 100%);
}
*, *::before, *::after{
   font-family: 'Roboto', sans-serif;
   box-sizing: border-box;
   margin: 0;
   padding: 0;
   transition: all 100ms ease;
   color: var(--main1);
}
html, body{
   width: 100%;
   height: 100%;
   overflow-x: hidden;
   overflow-y: auto;
}
body{
   background: var(--bg1);
   background-attachment: fixed;
}
#app{
   display: flex;
   flex-direction: column;
   width: 100%;
}
a{
   text-decoration: underline;
   color: var(--main2);
}
a:hover{
   color: var(--main1);
}
p{
   line-height: 1.35;
   text-align: justify;
   hyphens: auto;
}
p.indent{
   text-indent: 2em;
}
.centered{
   display: flex;
   justify-content: center;
   align-items: center;
}
.button{
   background: transparent;
   border: none;
   cursor: pointer;
   padding: 0.7em;
   font-weight: bold;
   font-size: 1em;
}
.button:hover{
   background: var(--highlight1);
   border-color: var(--border-active);
}
.button:active{
   background: var(--highlight2);
}
.modalOverlay{
   position: fixed;
   inset: 0;
   z-index: 10;
   background: var(--lowlight1);
   display: flex;
   justify-content: center;
   padding-bottom: 5em;
}
.modalContainer{
   position: fixed;
   left: 50%;
   top: 5rem;
   transform: translateX(-50%);
   background: var(--bg1);
   box-shadow: 0 0 0.25em 0 var(--highlight1), 0 0 0.75em 0 var(--highlight2);
   padding: 1em;
   min-width: 20rem;
   max-width: 40rem;
   max-height: 30em;
   overflow-y: auto;
   overflow-x: hidden;
}
.modalContainer > *{
   padding-bottom: 0.7rem;
}
.modalContainer h1{
   text-align: center;
}
.modalContainer b{
   color: var(--accent1);
}
.line{
   position: relative;
}
.line::after{
   content: '';
   position: absolute;
   left: 10%;
   right: 10%;
   bottom: 0.4em;
   height: 2px;
   background: var(--main2);
   border-radius: 4px;
}
.levelTooltip, .strikeTooltip, .itemPreview span, .showcaseTooltip{
   position: absolute;
   visibility: hidden;
   padding-block: 0.2em;
   padding-inline: 0.35em;
   z-index: 1;
   background: var(--bg1);
   color: var(--main1);
   text-align: center;
   bottom: 120%;
   left: 50%;
   border-radius: 4px;
   box-shadow: 0 0 0.25em 0 var(--highlight1), 0 0 0.75em 0 var(--highlight2);
}
.levelTooltip::after, .strikeTooltip::after, .itemPreview span::after, .showcaseTooltip::after{
   content: " ";
   position: absolute;
   top: 100%;
   left: 50%;
   margin-left: -5px;
   border-width: 5px;
   border-style: solid;
   border-color: var(--bg1) transparent transparent transparent;
}
.fakeList{
   position: relative;
   padding-left: 2em;
}
.fakeList::before{
   content: "";
   position: absolute;
   top: 0.6em;
   left: 1.3em;
   width: 5px;
   height: 5px;
   border-radius: 50%;
   background: var(--accent1);
}
.searchbarContainer{
   padding-bottom: 1em;
}
.searchbar{
   background: transparent;
   color: var(--main1);
   border: 1.5px solid var(--main2);
   border-radius: 4px;
   padding: 0.5em 0.5em 0.55em 0.5em;
}
.searchbar:hover{
   border-color: var(--main1);
}
.searchbar:focus{
   border-color: var(--main1);
   outline: 0.25px solid var(--main1);
}
@media (max-height: 512px) {
   .modalContainer{
      top: 1rem;
      max-height: 15em !important;
   }
}
</style>
