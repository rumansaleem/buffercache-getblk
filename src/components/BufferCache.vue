<template>
    <div>
        <h4 class="text-xl mb-4">Buffer Cache</h4>
        <p class="mb-1">Buffers</p>
        <div id="buffer-list" class="flex flex-wrap items-center -m-1 mb-3">
            <span v-for="buffer in buffers"
                :key="buffer.id"
                class="font-semibold text-xs m-1 border rounded flex flex-col"
                :class="{
                    'bg-black text-white border-black': isLocked(buffer),
                    'bg-gray-200 text-black': !isLocked(buffer),
                }">
                <div class="inline-flex justify-between items-center font-normal leading-none px-2 py-1">
                    <span class="text-xs " v-text="buffer.id"></span>
                    <span class="text-xs font-semibold text-teal-600" v-text="buffer.blockNumber || 'NA'"></span>
                </div>
                <span class="font-mono text-xs px-2 py-1" v-text="buffer.data || '<empty>'"></span>
            </span>
        </div>
        <p class="mb-1">Hash Queue</p>
        <div id="hash-queue" class="mb-4">
            <div v-for="(queue, key) in hashqueue" :key="key">
                <h5 class="font-bold" v-text="`blockno mod ${hashqueue.length} = ${key}`"></h5>
                <div class="p-2 bg-gray-100 border rounded">
                    <div v-if="queue.length > 0">
                        <span  v-for="buffer in queue"
                            :key="buffer.id"
                            class="flex flex-col p-2 font-semibold text-xs m-1 border bg-gray-200 rounded">
                            <span v-text="`${buffer.blockNumber || 'NA'}`"></span>
                        </span>
                    </div>
                    <p v-else>&lt;empty&gt;</p>
                </div>
            </div>
        </div>
        <p class="mb-1">Free List</p>
        <div class="flex flex-wrap -m-1 mb-3">
            <span v-for="buffer in freelist"
                :key="buffer.id"
                class="p-2 font-semibold text-xs m-1 border bg-gray-200 rounded flex flex-col">
                <span class="text-xs" v-text="buffer.id"></span>
                <span v-text="`BLK: ${buffer.blockNumber || 'NA'}`"></span>
            </span>
        </div>
    </div>
</template>
<script>
import { mapState, mapActions, mapGetters } from 'vuex';

export default {
    name: 'buffer-cache',
    computed: {
        ...mapState('buffercache', ['buffers']),
        ...mapState('buffercache/freelist', {freelist: 'list'}),
        ...mapState('buffercache/hashqueue', {hashqueue: 'hashTable'}),
        ...mapGetters('buffercache', ['isLocked']),
    },
    methods: {
        ...mapActions('buffercache', [ 'init' ]),
    },
    created() {
        this.init({bufferCount: 5, hashQueueSize: 4});
    }
}
</script>
