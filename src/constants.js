export const IO_TYPE_READ = 'IO_TYPE_READ';
export const IO_TYPE_WRITE = 'IO_TYPE_WRITE';

export const STATUS_RUNNING = 'RUNNING';
export const STATUS_SLEEPING = 'SLEEPING';
export const STATUS_IDLE = 'IDLE';
export const STATUS_WAITING_FOR_ANY_BUFFER = 'WAITING_FOR_ANY_BUFFER';
export const STATUS_WAITING_FOR_SPECIFIC_BUFFER = (id) => `WAITING_FOR_BUFFER${id ? '_' + id : ''}`;