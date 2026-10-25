import './style.css'
import GameEngine, { Scoreboard, Color, Cell } from './GameEngine';
import type { Difficulty } from './GameEngine';

const FLAG_IMAGE_ASSET = "./src/assets/flag.png";
const MINE_IMAGE_ASSET = "./src/assets/mine.png";
const X_IMAGE_ASSET = "./src/assets/x.png";

class GUI
{
    board: HTMLCanvasElement = document.getElementById("board")! as HTMLCanvasElement;
    overlay: HTMLCanvasElement = document.getElementById("overlay")! as HTMLCanvasElement;

    ctx: CanvasRenderingContext2D = this.board.getContext("2d")!;

    mineCounterLabel: HTMLParagraphElement = document.getElementById("mineCount")! as HTMLParagraphElement;
    timerLabel: HTMLParagraphElement = document.getElementById("timer")! as HTMLParagraphElement;

    scoreboard: HTMLDivElement = document.getElementById("scoreboard")! as HTMLDivElement;
    currentTimeScoreboardLabel: HTMLParagraphElement = document.getElementById("currentTime")! as HTMLParagraphElement;
    bestTimeScoreboardLabel: HTMLParagraphElement = document.getElementById("bestTime")! as HTMLParagraphElement;

    engine: GameEngine;
    
    cellSize: number;

    flagImage: HTMLImageElement;
    mineImage: HTMLImageElement;
    xImage: HTMLImageElement;

    labelEvent: number = -1;

    abortController: AbortController

    constructor(difficulty?: Difficulty)
    {
        this.abortController = new AbortController();

        const boundingBox = this.board.getBoundingClientRect();
        
        this.board.width = boundingBox.width;
        this.board.height = boundingBox.height;
        
        this.overlay.width = boundingBox.width;
        this.overlay.height = boundingBox.height;
        
        this.engine = GameEngine.fromDifficulty(difficulty);
        // this.cellSize = Math.floor(Math.min(boundingBox.width/this.engine.cols, boundingBox.height/this.engine.rows));
        this.cellSize = (boundingBox.width/this.engine.cols);
        this.ctx.font = `bold ${this.board.width/boundingBox.width*10}px sans-serif`;
        
        this.flagImage = new Image();
        this.flagImage.src = FLAG_IMAGE_ASSET;

        this.mineImage = new Image();
        this.mineImage.src = MINE_IMAGE_ASSET;

        this.xImage = new Image();
        this.xImage.src = X_IMAGE_ASSET;


        window.addEventListener("resize", (_)=>{
            
            const boundingBox = this.board.getBoundingClientRect();
            
            this.board.width = boundingBox.width;
            this.board.height = boundingBox.height;

            this.overlay.width = boundingBox.width;
            this.overlay.height = boundingBox.height;

            // this.cellSize = Math.floor(Math.min(boundingBox.width/this.engine.cols, boundingBox.height/this.engine.rows));
            this.cellSize = (boundingBox.width/this.engine.cols);

            if(this.engine.gameOver)
                this.showScoreboard();
            
            this.erase();
            this.draw();
        }, { signal: this.abortController.signal})

        this.overlay.addEventListener("mousemove", (e) =>
        {
            if(this.engine.gameOver) return
            
            const rect = this.board.getBoundingClientRect();
            const overlayRect = this.overlay.getBoundingClientRect();

            const c = Math.floor((e.clientX - rect.left)/this.cellSize);
            const r = Math.floor((e.clientY - rect.top)/this.cellSize);

            const overlayCtx = this.overlay.getContext("2d")!;

            overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);

            overlayCtx.fillStyle = "rgba(255, 255, 255, 0.3)";
            overlayCtx.fillRect(c * this.cellSize, r * this.cellSize, this.cellSize, this.cellSize);
        }, { signal: this.abortController.signal});

        this.overlay.addEventListener("mouseleave", ()=> {
            
            if(this.engine.gameOver) return;
            
            const overlayCtx = this.overlay.getContext("2d")!;
            overlayCtx.clearRect(0, 0, this.overlay.width, this.overlay.height);
        }, { signal: this.abortController.signal});

        this.overlay.addEventListener("click", (e) => {

            if(this.engine.gameOver) return;

            const rect = this.board.getBoundingClientRect();

            const c = Math.floor((e.clientX - rect.left)/this.cellSize);
            const r = Math.floor((e.clientY - rect.top)/this.cellSize);

            this.step([c, r]);

        }, { signal: this.abortController.signal});


        this.overlay.addEventListener("dblclick", (e)=>this.teetherClick(e), { signal: this.abortController.signal});
        this.overlay.addEventListener("auxclick", (e)=>{
            if(e.button === 1)
                this.teetherClick(e);
        }, { signal: this.abortController.signal});


        this.overlay.addEventListener("contextmenu", (e) => {

            
            e.preventDefault();
            if(this.engine.gameOver) return;

            const rect = this.board.getBoundingClientRect();
            
            const c = Math.floor((e.clientX - rect.left)/this.cellSize);
            const r = Math.floor((e.clientY - rect.top)/this.cellSize);

            this.engine.toggleFlag([c, r]);

            this.erase();
            this.draw();

            this.updateLabels(0);
        }, { signal: this.abortController.signal});
        
        this.updateLabels(0);
        this.timerLabel.innerText = "0";
        // this.updateLabels(1);
    }

    private step([c, r]: [number, number], teether: boolean = false)
    {
        // console.log("draw");
        const res = this.engine.step([c, r]);
        // console.log("execute step");

        if (this.labelEvent === -1)
        {
            this.labelEvent = setInterval(()=>this.updateLabels(1), 10);
        }
        

        if(res === -1 || (res === -2 && teether))
            this.blowup([c, r]);
        else if(res !== -2)
        {
            this.erase();
            this.draw();

            if(res === 1)
            {
                this.win();
            }
        }
    }
    
    private erase(): void
    {
        this.ctx.clearRect(0, 0, this.board.width, this.board.height);
    }

    public cleanUp(): void
    {
        this.erase();
        this.overlay.getContext("2d")!.clearRect(0,0, this.overlay.width, this.overlay.height);

        this.abortController.abort();
        clearInterval(this.labelEvent);

        this.overlay.classList.remove("darken");

        this.scoreboard.classList.remove("shown");
        this.scoreboard.classList.add("hidden");
    }

    private distanceTo([x1, y1]: number[], [x2, y2]: number[]): number
    {
        return Math.sqrt(Math.pow((x2-x1),2) + Math.pow((y2-y1), 2));
    }

    async blowup(first: number[])
    {
        const minesAndFlags = this.engine.bfsCells().filter(([x, y])=> (this.engine.board[y][x] & (Cell.IS_FLAGGED | Cell.IS_MINE)) !== 0);

        minesAndFlags.sort((a, b) => this.distanceTo(first, a)-this.distanceTo(first, b));

        let i = 0;

        const interval = setInterval(()=>{
            if(i >= minesAndFlags.length)
            {
                clearInterval(interval);
                this.showScoreboard();
                return;
            }

            const [mX, mY] = minesAndFlags[i++];

            
            this.engine.board[mY][mX] |= Cell.IS_REVEALED;
            
            this.ctx.fillStyle = this.engine.getBackgroundColor([mX, mY]);
            this.ctx.fillRect(mX * this.cellSize, mY * this.cellSize, this.cellSize, this.cellSize);

            this.ctx.drawImage((this.engine.board[mY][mX] & Cell.IS_MINE) === 0 ? this.xImage : this.mineImage, mX * this.cellSize, mY * this.cellSize, this.cellSize, this.cellSize);
        }, 15
    );
    }

    async win()
    {
        const cells = this.engine.bfsCells().filter(([x,y])=> (this.engine.board[y][x] & Cell.IS_MINE) === 0);
        
        let i = 0;

        const interval = setInterval(() => {
            if(i >= cells.length)
            {
                clearInterval(interval);
                this.engine.won = true;
                this.showScoreboard();
                return;
            }

            const [x, y] = cells[i++];

            this.ctx.fillStyle = (x+y)%2 === 0 ? Color.WON_DARK_CHECKER : Color.WON_LIGHT_CHECKER;
            this.ctx.fillRect(x* this.cellSize, y * this.cellSize, this.cellSize, this.cellSize);

        }, 15);
    }

    updateLabels(option: number)
    {
        if(option === 0)
            this.mineCounterLabel.innerText = this.engine.flagsLeft().toString();
        else
            this.timerLabel.innerText = this.engine.getTimeElapsed().toFixed(1);
    }
    
    draw()
    {
        this.ctx.textAlign = "left";
        this.ctx.textBaseline = "top";
        this.ctx.font = `bold ${Math.floor(this.cellSize*0.5)}px sans-serif`;
        for(let r = 0; r < this.engine.rows; r++)
        {
            for(let c = 0; c < this.engine.cols; c++)
            {
                this.ctx.fillStyle = this.engine.getBackgroundColor([c, r]);   
                this.ctx.fillRect(this.cellSize * c, this.cellSize * r, this.cellSize, this.cellSize);

                if(this.engine.board[r][c] & Cell.IS_FLAGGED)
                {
                    this.ctx.drawImage(this.flagImage, this.cellSize*c, this.cellSize*r, this.cellSize, this.cellSize);
                }
                else if(this.engine.board[r][c] & Cell.IS_MINE && this.engine.board[r][c] & Cell.IS_REVEALED)
                {
                    this.ctx.drawImage(this.mineImage, this.cellSize * c, this.cellSize* r, this.cellSize, this.cellSize);
                }
                // else if(this.engine.board[r][c] & Cell.IS_MINE)
                // {
                //     this.ctx.fillStyle = "red";
                //     this.ctx.fillText("M", this.cellSize *c + this.cellSize/4, this.cellSize * r + this.cellSize/4 );
                // }
                else if(!this.engine.won && this.engine.board[r][c] & Cell.IS_REVEALED)
                {
                    this.ctx.fillStyle = this.engine.getFontColor([c,r]);
                    this.ctx.fillText(this.engine.getMines([c, r]).toString(), this.cellSize *c + this.cellSize/4, this.cellSize * r + this.cellSize/4);
                }

            }
        }
    }

    private teetherClick(e: MouseEvent)
    {
        e.preventDefault();

        if(this.engine.gameOver) return;

        const rect = this.board.getBoundingClientRect();

        const c = Math.floor((e.clientX - rect.left)/this.cellSize);
        const r = Math.floor((e.clientY - rect.top)/this.cellSize);

        const highlightedCells = this.engine.teether([c, r]);

        // console.log(highlightedCells);
        const overlayCtx = this.overlay.getContext("2d")!;
        overlayCtx.fillStyle = "rgba(255, 255, 255, 0.3)";


        for(const [cx, cy] of highlightedCells)
        {   
            overlayCtx.fillRect(cx * this.cellSize, cy * this.cellSize, this.cellSize, this.cellSize);
            setTimeout(()=>{
                overlayCtx.clearRect(cx * this.cellSize, cy * this.cellSize, this.cellSize, this.cellSize);
            }, 100)                
        }

        this.step([c, r], true);
    }

    showScoreboard()
    {
        
        // this.overlay.classList.add("darken");
        const overlayCtx = this.overlay.getContext("2d")!;

        overlayCtx.fillStyle = "rgba(74, 73, 73, 0.82)";
        overlayCtx.fillRect(0,0, this.cellSize * this.engine.cols, this.cellSize * this.engine.rows);

        this.scoreboard.classList.remove("hidden");
        this.scoreboard.classList.add("shown");
        
        this.currentTimeScoreboardLabel.innerText = this.engine.won ? this.engine.getTimeElapsed().toString() : "---";
        this.bestTimeScoreboardLabel.innerText = `${Scoreboard.getBestTime(this.engine.difficulty) ?? "---"}`;
    }
}



const difficultySelection: HTMLSelectElement = document.getElementById("difficultySelection")! as HTMLSelectElement;
difficultySelection.selectedIndex = 1;

const redoBtn: HTMLButtonElement = document.getElementById("redo")! as HTMLButtonElement;


let gui = new GUI();
gui.draw();


const restart = () => {
    const difficulty: Difficulty = difficultySelection.options[difficultySelection.selectedIndex].value.toUpperCase() as Difficulty;

    gui.cleanUp();

    gui = new GUI(difficulty);

    gui.draw();
}


redoBtn.onclick = restart;

difficultySelection.addEventListener("change", restart);
