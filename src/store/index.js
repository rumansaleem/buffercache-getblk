import Vue from 'vue';
import Vuex from 'vuex';

import buffercache from './buffercache';
import disk from './disk';
import processes from './processes';
import kernel from './kernel';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        buffercache,
        disk,
        processes,
        kernel,
    },
    strict: true,
});

export default store;