<template>
    <div class="m-1">
        <div class="mb-3 flex justify-between items-center">
            <h4 class="font-semibold uppercase text-gray-800" v-text="`${process.name} (PID: ${process.pid})`"></h4>
            <button v-if="canRun(process)" @click.prevent="run" class="p-1 border border-teal-600 bg-teal-500 hover:bg-teal-600 text-white rounded">
                <svg class="fill-current h-4" viewBox="0 0 20 20" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <polygon points="4 4 16 10 4 16"></polygon>
                </svg>
            </button>
        </div>
        <div class="mb-3 inline-flex items-center">
            <svg viewBox="0 0 20 20" class="fill-current h-4 mr-2" version="1.1" xmlns="http://www.w3.org/2000/svg" >
                <polygon v-if="isRunning(process)" points="4 4 16 10 4 16"></polygon>
                <g v-else-if="isWaitingForBuffer(process)" id="hourglass" fill-rule="evenodd">
                    <path d="M17,18 C17,15.207604 15.3649473,12.7970951 13,11.6736312 L13,8.32636884 C15.3649473,7.2029049 17,4.79239596 17,2 L19,2 L19,0 L1,0 L1,2 L3,2 C3,4.79239596 4.63505267,7.2029049 7,8.32636884 L7,11.6736312 C4.63505267,12.7970951 3,15.207604 3,18 L1,18 L1,20 L19,20 L19,18 L17,18 Z M15,2 C15,4.41895791 13.2822403,6.43671155 11,6.89998188 L11,7.96455557 L11,10 L9,10 L9,7.96455557 L9,6.89998188 C6.71775968,6.43671155 5,4.41895791 5,2 L15,2 Z" id="Combined-Shape"></path>
                </g>
                <g v-else-if="isSleeping(process)" id="clock" fill-rule="evenodd">
                    <path d="M9,8.5 L9,4 L11,4 L11,9.58578644 L14.9497475,13.5355339 L13.5355339,14.9497475 L9,10.4142136 L9,8.5 Z M10,20 C15.5228475,20 20,15.5228475 20,10 C20,4.4771525 15.5228475,0 10,0 C4.4771525,0 0,4.4771525 0,10 C0,15.5228475 4.4771525,20 10,20 Z M10,18 C14.418278,18 18,14.418278 18,10 C18,5.581722 14.418278,2 10,2 C5.581722,2 2,5.581722 2,10 C2,14.418278 5.581722,18 10,18 Z" id="Combined-Shape"></path>
                </g>
            </svg>
            <span v-text="statusText(process)"></span>
        </div>
        <h5 class="font-semibold text-xs uppercase text-teal-500 mb-2">Add I/O Requests</h5>
        <form @submit.prevent="submit" class="mb-4 flex leading-none">
            <select v-model="io_type" class="px-1 py-2 border rounded-l bg-white">
                <option v-for="(option, key) in ioTypeOptions" :key="key" :value="option" v-text="key"></option>
            </select>
            <input type="number" v-model="blockNumber" class="px-1 py-2 border border-l-0 flex-1 text-sm transition-width" placeholder="Block No">
            <input v-if="io_type === ioTypeOptions.Write" type="text" v-model="data" class="px-1 py-2 border border-l-0 flex-1 text-sm" placeholder="Data">
            <button type="submit" class="px-3 py-2 bg-teal-500 text-white border border-teal-600 rounded-r" key="btn">Add</button>
        </form>
        <h5 class="font-semibold text-xs uppercase text-teal-500 mb-2">Buffer I/O Requests</h5>
        <transition-group tag="div" name="list" v-if="requests.length > 0" class="flex flex-wrap -m-2 max-h-32 overflow-y-auto overflow-x-hidden">
            <div v-for="request in requests"
                class="m-2 leading-none inline-flex max-w-90"
                :key="`${request.type}-${request.blockNumber}`">
                <span v-if="isReqRunning(request)" class="inline-flex items-center p-2 bg-green-500 rounded-l">
                    <div class="bg-white w-2 h-2 rounded-full"></div>
                </span>
                <span class="capitalize bg-gray-900 text-white p-2 flex-no-shrink" :class="{'rounded-l': !isReqRunning(request)}" v-text="request.type.replace('IO_TYPE_', '').toLowerCase()"></span>
                <span v-if="request.type == ioTypeOptions.Write" class="flex-grow bg-gray-300 truncate p-2" v-text="`'${request.data}'`"></span>
                <span class="bg-teal-500 text-white font-semibold p-2 rounded-r flex-no-shrink" v-text="request.blockNumber"></span>
            </div>
        </transition-group>
        <div class="mb-2" v-else>
            No requests yet
        </div>
    </div>
</template>
<script>
import { 
    IO_TYPE_READ,
    IO_TYPE_WRITE,
    STATUS_RUNNING,
    STATUS_WAITING_FOR_ANY_BUFFER,
    STATUS_WAITING_FOR_SPECIFIC_BUFFER,
    STATUS_IDLE,
    STATUS_SLEEPING,
} from '../constants';
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
        ...mapGetters('processes', [
            'activeRequestsByProcess',
            'isRunning',
            'isWaitingForBuffer',
            'isWaitingForSpecificBuffer',
            'isIdle',
            'isSleeping',
            'canRun',
            'statusText'
        ]),
        requests() {
            return this.activeRequestsByProcess(this.process);
        },
    },
    methods: {
        isReqRunning(request) {
            return request === this.process.runningRequest;
        },
        ...mapGetters('buffercache', ['getBufferById']),
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

