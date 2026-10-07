import Queue from "./Queue";

export enum Color
{
    LIGHT_CHECKER = "#AAD751",
    DARK_CHECKER = "#a2d149",
    REVEALED_LIGHT_CHECKER = "#E5C29F",
    REVEALED_DARK_CHECKER = "#d7b899"
}

export enum Cell
{
    IS_MINE = 16,
    IS_REVEALED = 32,
    MAXIMUM_MINES = 0b1111

}

const FONT_COLORS = [
    "",
    "#1976D2",
    "#388e3c",
    "#d32f2f",
    "#8333a2",
    "#f29000",
    "#0097a7",
    "#424242",
    "#a29383"
]

export default class GameEngine
{
    rows: number;
    cols: number;
    maxMines: number;
    started: boolean;

    board: number[][]

    constructor(rows: number, cols: number, maxMines = 99)
    {
        this.rows = rows;
        this.cols = cols;
        this.maxMines = maxMines;
        
        this.board = Array.from({length: this.rows}, ()=>Array.from({length: this.cols}, ()=>0));
        this.started = false;
    }

    generateMines([nX, nY]: [number, number])
    {
        let mineCount = 0;

        this.getNeighboringCells([nX, nY]).forEach(([x, y])=> this.board[y][x] |= Cell.IS_REVEALED);

        while(mineCount < this.maxMines)
        {
            const rX = Math.floor(Math.random() * this.cols);
            const rY = Math.floor(Math.random() * this.rows);

            if(
                (rX == nX && rY == nY) ||
                (this.board[rY][rX] & Cell.IS_MINE) ||
                (this.board[rY][rX] & Cell.IS_REVEALED)
            ) continue;

            this.board[rY][rX] |= Cell.IS_MINE;
            mineCount++;
        }

        for(let r = 0; r< this.rows; r++)
        {
            for(let c = 0; c < this.cols; c++)
            {
                this.board[r][c] += this.preGetMines([c, r]);
            }
        }
    }

    private preGetMines(coords: [number, number]): number
    {
        return this.getNeighboringCells(coords).filter(([x,y])=>this.board[y][x] & Cell.IS_MINE).length;
    }

    getMines([x, y]: [number, number]): number
    {
        return this.board[y][x] & Cell.MAXIMUM_MINES;
    }

    getNeighboringCells([x, y]: [number, number]): number[][]
    {
        const neighbors = [];

        for(let dy = -1; dy <= 1; dy++)
        {
            for(let dx = -1; dx <= 1; dx++)
            {
                if(dy == 0 && dx == 0) continue;

                const newX = x+dx;
                const newY = y+dy;

                if(newX < 0 || newX >= this.cols || newY < 0 || newY >= this.rows) continue;
                
                neighbors.push([newX, newY]);
            }
        }

        return neighbors;
    }

    getBackgroundColor([x, y]: [number, number]): string
    {
        if(this.board[y][x] & Cell.IS_REVEALED)
        {
            return (y+x)%2 == 0 ? Color.REVEALED_DARK_CHECKER : Color.REVEALED_LIGHT_CHECKER;
        }
        else
        {
            return (y+x)%2 == 0 ? Color.DARK_CHECKER : Color.LIGHT_CHECKER;
        }
    }

    getFontColor(coords: [number, number]): string
    {
        return FONT_COLORS[this.getMines(coords)];
    }

    step([x, y]: [number, number]): number
    {
        if(!this.started)
        {
            this.generateMines([x, y]);
            this.started = true;
        }

        if(this.board[y][x] & Cell.IS_REVEALED) return 0;
        
        if(this.board[y][x] & Cell.IS_MINE) return -1;

        // this.board[y][x] |= Cell.IS_REVEALED;

        this.flood_select([x, y]);


        return 0;
    }

    private flood_select(coords: [number, number])
    {
        const queue = new Queue<[number, number]>();

        queue.push(coords);

        while(queue.size > 0)
        {
            console.log(queue);
            let [x, y] = queue.remove()! as [number, number];

            console.log(`(${x}, ${y})`)

            if(this.board[y][x] & Cell.IS_MINE || this.board[y][x] & Cell.IS_REVEALED) continue;
            
            this.board[y][x] |= Cell.IS_REVEALED;
            
            if(this.getMines([x,y]) === 0)
                this.getNeighboringCells([x, y]).forEach(e=>queue.push(e));
            
        }
    }
}