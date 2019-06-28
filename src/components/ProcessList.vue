<template>
<div>
    <h4 class="text-xl mb-2">Processes</h4>
    <form class="flex mb-3" @submit.prevent="submit">
        <input type="text" class="px-2 py-1 border rounded-l flex-1" placeholder="New Process Name" v-model="newProcessName">
        <button class="bg-teal-500 text-white py-2 px-3 border border-teal-600 rounded-r">Create</button>
    </form>
    <div v-if="processes.length" class="flex flex-wrap -m-1">
        <Process v-for="process in processes" :key="process.pid" :process="process" class="border p-4 w-72"/>
    </div>
    <div class="" v-else> 
        No processes created.
    </div>
</div>
</template>
<script>
import Process from './Process';
import { mapState, mapMutations, mapGetters } from 'vuex';

export default {
    components: {Process},
    data() {
        return {
            newProcessName: '',
        };
    },
    computed: {
        ... mapState('processes', {processes: 'all'}),
    },
    methods: {
        ...mapMutations('processes', ['initialise', 'createNewProcess']),
        submit() {
            this.createNewProcess(this.newProcessName);
            this.newProcessName = '';
        }
    },
    created() {
        this.initialise(2);
    }
}
</script>
