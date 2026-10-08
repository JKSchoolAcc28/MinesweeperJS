type Node<T> = {
    value: T,
    next?: Node<T>
};

export default class Queue<T>
{
    head?: Node<T>;
    tail?: Node<T>;
    size: number;

    constructor()
    {
        this.size = 0;
    }

    push(val: T)
    {
        if(this.head === undefined || this.tail == undefined)
        {
            this.head = {
                value: val,
            };

            this.tail = this.head;
        }
        else
        {
            this.tail!.next = { value: val };
            this.tail = this.tail.next;
        }

        this.size++;
        
    }

    remove(): T | undefined
    {
        if(this.head !== undefined)
        {
            const val = this.head.value;

            if(this.tail === this.head) 
                this.tail = undefined;

            this.head = this.head.next;

            this.size--;

            return val;
        }
    }
}