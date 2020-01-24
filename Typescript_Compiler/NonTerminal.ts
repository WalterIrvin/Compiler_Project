export class NonTerminal
{
    label: string;
    neighbors: NonTerminal[];
    constructor(label: string)
    {
        this.label = label
        this.neighbors = []
    }
    setNeighbors(neighborList: Array<NonTerminal>)
    {
        this.neighbors = neighborList;
    }
}