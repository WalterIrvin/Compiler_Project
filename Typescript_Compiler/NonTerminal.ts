export class NonTerminal
{
    label: string;
    neighbors: Array<NonTerminal>;
    constructor(label: string)
    {
        this.label = label
        this.neighbors = []
    }
    setNeighbors(neighborList: Array<NonTerminal>)
    {
        this.neighbors = neighborList;
    }
    addNeighbors(neighborList: Array<NonTerminal>)
    {
        neighborList.forEach((item: NonTerminal) => { 
            //appends new neighbors like using | would do
            this.neighbors.push(item);
        });
    }
}