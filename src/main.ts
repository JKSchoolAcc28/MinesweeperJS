import './style.css'
import GameEngine, { Color, Cell } from './GameEngine';


const board = document.getElementById("board")! as HTMLCanvasElement;
const ctx = board.getContext("2d")!;


const boundingBox = board.getBoundingClientRect();
board.width = boundingBox.width;
board.height = boundingBox.height;

const engine = new GameEngine(25, 25);


// engine.generateMines([0,0]);
engine.step([0,0]);
engine.step([1,0]);

const SIZE = Math.floor(Math.min(boundingBox.width/engine.cols, boundingBox.height/engine.rows));

ctx.fillStyle = "black";
ctx.textAlign = "left";
ctx.textBaseline = "top";
ctx.font = "bold 10px sans-serif";

for(let r = 0; r < engine.rows; r++)
{
    for(let c = 0; c < engine.cols; c++)
    {
        ctx.fillStyle = engine.getBackgroundColor([c, r]);   
        ctx.fillRect(SIZE * c, SIZE * r, SIZE, SIZE);

        if(engine.board[r][c] & Cell.IS_MINE)
        {
            ctx.fillStyle = "red";
            ctx.fillText("M", SIZE *c + 5, SIZE * r + 5 );
        }
        else
        {
            ctx.fillStyle = engine.getFontColor([c,r]);
            ctx.fillText(engine.getMines([c, r]).toString(), SIZE *c + 6.9, SIZE * r + 5 );
        }
    }
}
        


document.getElementById("app")!.innerText = JSON.stringify(engine.board);