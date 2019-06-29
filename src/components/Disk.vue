<template>
    <div>
        <h4 class="text-xl mb-3">Secondary Memory</h4>  
        <div class="mb-4">
            <strong class="text-xs uppercase mr-2">status</strong>
            <span class="text-teal-600 font-bold" v-text="statusText"></span>
        </div>
        <p class="mb-1">Disk Blocks</p>
        <div id="buffer-list" class="flex flex-wrap items-center -m-1 font-mono leading-none">
            <div v-for="block in blocks"
                :key="block.blockNumber"
                class="text-xs m-1 border bg-gray-200 rounded relative overflow-hidden">
                <div class="inline-block p-1 rounded text-xs text-gray-900 font-hairline" 
                    v-text="block.blockNumber"></div>
                <p class="py-2 px-4" v-text="block.data || '<empty>'"></p>
            </div>
        </div>
    </div>
</template>
<script>
import { mapState, mapMutations } from 'vuex';
import { INITIALISE } from '../store/disk';

export default {
    name: 'disk',
    computed: {
        ...mapState('disk', ['blocks', 'isReading', 'isWriting']),
        statusText() {
            return this.isReading ? 'Reading Block...' 
                : ( this.isWriting ? 'Writing Block...'
                    : 'Idle!'
                );
        }
    },
    methods: {
        ...mapMutations('disk', [ INITIALISE ])
    },
    created() {
        this.initialise(10);
    }
}
</script>
