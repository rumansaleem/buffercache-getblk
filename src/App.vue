<template>
  <div id="app" class="h-screen bg-teal-500 p-4 flex overflow-hidden">
    <Disk class="w-64 bg-white p-4 overflow-y-auto" />
    <div class="flex-1 bg-white p-4">
      <ProcessList />
    </div>
    <BufferCache class="w-64 bg-white p-4 overflow-y-auto"/>
  </div>
</template>

<script>
import BufferCache from './components/BufferCache';
import Disk from './components/Disk';
import ProcessList from './components/ProcessList';
export default {
  name: 'app',
  components: {
    BufferCache,
    Disk,
    ProcessList,
  },
}
</script>

<style lang="postcss">
  @tailwind base;

  html, body {
    @apply text-sm;
  }
  input[type="number"] {
    -moz-appearance: textfield;
  }
  select {
    appearance: none;
    -moz-appearance: none;
  }
  input {
    min-width: 2em;
  }
  
  @tailwind components;
  @tailwind utilities;
</style>
