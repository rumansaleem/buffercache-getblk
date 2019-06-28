<template>
    <div class="m-1">
        <div class="mb-4 flex justify-between items-center">
            <h4 class="font-semibold uppercase text-gray-800" v-text="`${process.name} (PID: ${process.pid})`"></h4>
            <button @click.prevent="run" class="p-1 border border-teal-600 bg-teal-500 hover:bg-teal-600 text-white rounded">
                <svg v-if="!process.running" class="fill-current h-4" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="4 4 16 10 4 16"></polygon>
                </svg>
                <svg v-else class="fill-current h-4" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
                    <path d="M5,4 L8,4 L8,16 L5,16 L5,4 Z M12,4 L15,4 L15,16 L12,16 L12,4 Z"></path>
                </svg>
            </button>
        </div>
        <h5 class="font-semibold text-xs uppercase text-teal-500 mb-2">Add I/O Requests</h5>
        <form @submit.prevent="submit" class="mb-4 flex leading-none">
            <select v-model="io_type" class="px-1 py-2 border rounded-l bg-white">
                <option v-for="(option, key) in ioTypeOptions" :key="key" :value="option" v-text="key"></option>
            </select>
            <input type="number" v-model="blockNumber" class="px-1 py-2 border border-l-0 flex-1 text-sm transition-width" placeholder="Block No">
            <input v-if="io_type === 'write'" type="text" v-model="data" class="px-1 py-2 border border-l-0 flex-1 text-sm" placeholder="Data">
            <button type="submit" class="px-3 py-2 bg-teal-500 text-white border border-teal-600 rounded-r" key="btn">Add</button>
        </form>
        <h5 class="font-semibold text-xs uppercase text-teal-500 mb-2">Buffer I/O Requests</h5>
        <transition-group tag="div" name="list" v-if="requests.length > 0" class="flex flex-wrap -m-2 max-h-32 overflow-y-auto">
            <div v-for="request in requests"
                class="m-2 leading-none flex"
                :key="`${request.type}-${request.blockNumber}`">
                <span v-if="isReqRunning(request)" class="inline-flex items-center p-2 bg-green-500 rounded-l">
                    <div class="bg-white w-2 h-2 rounded-full"></div>
                </span>
                <span class="capitalize bg-gray-300 p-2" :class="{'rounded-l': !isReqRunning(request)}" v-text="request.type"></span>
                <span class="bg-teal-500 text-white font-semibold p-2 rounded-r" v-text="request.blockNumber"></span>
            </div>
        </transition-group>
        <div class="mb-2" v-else>
            No requests yet
        </div>
    </div>
</template>
<script>
import { IO_TYPE_READ, IO_TYPE_WRITE } from '../constants';
import { mapActions, mapGetters } from 'vuex';
export default {
    props: {
        process: {required: true}
    },
    data() {
        return {
            ioTypeOptions: {'Read': IO_TYPE_READ, 'Write': IO_TYPE_WRITE},
            blockNumber: '',
            io_type: IO_TYPE_READ,
            data: '',
        }
    },
    computed: {
        ... mapGetters('processes', ['activeRequestsByProcess']),
        requests() {
            return this.activeRequestsByProcess(this.process);
        }
    },
    methods: {
        isReqRunning(request) {
            return request === this.process.runningRequest;
        },
        ...mapGetters('processes', ['activeRequestsByProcessId']),
        ...mapActions('processes', ['runProcess', 'enqueueRequest']),
        run() {
            this.runProcess(this.process);
        },
        submit() {
            this.enqueueRequest({
                process: this.process, 
                blockNumber: this.blockNumber,
                type: this.io_type,
                data: this.data
            });
            this.blockNumber = null;
            this.data = null
        }
    }
}
</script>

<style>
    .list-move {
        transition:  transform 0.4s;
    }
    .list-enter-active, .list-leave-active {
        transition: opacity .5s;
    }
    .list-enter, .list-leave-to {
        opacity: 0;
    }
    .expand-enter-active, .expand-leave-active {
        transition: all 1s;
    }
    .expand-enter, 
    .expand-leave-to {
        opacity: 0;
    }
    .expand-enter {
        transform: translateX(-100%);
    }
    .expand-leave-to {
        transform: translateX(100%);
    }
</style>

