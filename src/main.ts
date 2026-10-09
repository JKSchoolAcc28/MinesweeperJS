import './style.css'
import GameEngine, { Color, Cell } from './GameEngine';

const FLAG_IMAGE_ASSET = "./src/assets/flag.png";
const MINE_IMAGE_ASSET = "./src/assets/mine.png";

class GUI
{
    board: HTMLCanvasElement = document.getElementById("board")! as HTMLCanvasElement;
    overlay: HTMLCanvasElement = document.getElementById("overlay")! as HTMLCanvasElement;

    ctx: CanvasRenderingContext2D = this.board.getContext("2d")!;
    engine: GameEngine;
    
    cellSize: number;

    flagImage: HTMLImageElement;
    mineImage: HTMLImageElement;

    constructor()
    {
        const boundingBox = this.board.getBoundingClientRect();
        
        this.board.width = boundingBox.width;
        this.board.height = boundingBox.height;
        
        this.overlay.width = boundingBox.width;
        this.overlay.height = boundingBox.height;
        
        this.engine = new GameEngine(25, 25);
        this.cellSize = Math.floor(Math.min(boundingBox.width/this.engine.cols, boundingBox.height/this.engine.rows));
        this.ctx.font = `bold ${this.board.width/boundingBox.width*10}px sans-serif`;
        
        this.flagImage = new Image();
        this.flagImage.src = FLAG_IMAGE_ASSET;

        this.mineImage = new Image();
        this.mineImage.src = MINE_IMAGE_ASSET;

        window.addEventListener("resize", (_)=>{
            
            const boundingBox = this.board.getBoundingClientRect();
            
            this.board.width = boundingBox.width;
            this.board.height = boundingBox.height;

            this.overlay.width = boundingBox.width;
            this.overlay.height = boundingBox.height;

            this.cellSize = Math.floor(Math.min(boundingBox.width/this.engine.cols, boundingBox.height/this.engine.rows));
            this.erase();
            this.draw();
        })

        this.overlay.onmousemove = (e) =>
        {
            const rect = this.board.getBoundingClientRect();

            const c = Math.floor((e.clientX - rect.left)/this.cellSize);
            const r = Math.floor((e.clientY - rect.top)/this.cellSize);

            const overlayCtx = this.overlay.getContext("2d")!;

            overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);

            overlayCtx.fillStyle = "rgba(255, 255, 255, 0.3)";
            overlayCtx.fillRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
        }

        this.overlay.onclick = (e) => {
            const rect = this.board.getBoundingClientRect();

            const c = Math.floor((e.clientX - rect.left)/this.cellSize);
            const r = Math.floor((e.clientY - rect.top)/this.cellSize);

            const res = this.engine.step([c, r]);

            
            
            if(res === -1)
                this.blowup([c, r]);
            else if(res !== -2)
            {
                this.erase();
                this.draw();
            }
        }

        this.overlay.oncontextmenu = (e) => {
            e.preventDefault();

            const rect = this.board.getBoundingClientRect();
            
            const c = Math.floor((e.clientX - rect.left)/this.cellSize);
            const r = Math.floor((e.clientY - rect.top)/this.cellSize);

            this.engine.toggleFlag([c, r]);

            this.erase();
            this.draw();
        }

    }
    
    private erase()
    {
        this.ctx.clearRect(0, 0, this.board.width, this.board.height);
    }

    private distanceTo([x1, y1]: number[], [x2, y2]: number[]): number
    {
        return Math.sqrt(Math.pow((x2-x1),2) + Math.pow((y2-y1), 2));
    }

    async blowup(first: number[])
    {
        const mines = this.engine.getMineLocations();

        mines.sort((a, b) => this.distanceTo(first, a)-this.distanceTo(first, b));

        let i = 0;

        const interval = setInterval(()=>{
            if(i >= mines.length)
            {
                clearInterval(interval);
                return;
            }

            const [mX, mY] = mines[i++];

            this.engine.board[mY][mX] |= Cell.IS_REVEALED;

            this.ctx.fillStyle = this.engine.getBackgroundColor([mX, mY]);
            this.ctx.fillRect(mX * this.cellSize, mY * this.cellSize, this.cellSize, this.cellSize);
        
            this.ctx.drawImage(this.mineImage, mX * this.cellSize, mY * this.cellSize, this.cellSize, this.cellSize);
        }, 15
    );
    }
    
    draw()
    {
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";
        this.ctx.font = `bold 10px sans-serif`;
        for(let r = 0; r < this.engine.rows; r++)
        {
            for(let c = 0; c < this.engine.cols; c++)
            {
                this.ctx.fillStyle = this.engine.getBackgroundColor([c, r]);   
                this.ctx.fillRect(this.cellSize * c, this.cellSize * r, this.cellSize, this.cellSize);

                if(this.engine.board[r][c] & Cell.IS_MINE)
                {
                    this.ctx.fillStyle = "red";
                    this.ctx.fillText("M", this.cellSize *c + this.cellSize/4, this.cellSize * r + this.cellSize/4 );
                }
                if(this.engine.board[r][c] & Cell.IS_REVEALED)
                {
                    this.ctx.fillStyle = this.engine.getFontColor([c,r]);
                    this.ctx.fillText(this.engine.getMines([c, r]).toString(), this.cellSize *c + this.cellSize/4, this.cellSize * r + this.cellSize/4);
                }
                else if(this.engine.board[r][c] & Cell.IS_FLAGGED)
                {
                    this.ctx.drawImage(this.flagImage, this.cellSize*c, this.cellSize*r, this.cellSize, this.cellSize);
                }
            }
        }
    }
}




// const engine = new GameEngine(25, 25);


// engine.generateMines([0,0]);

const gui = new GUI();

gui.draw();



        



