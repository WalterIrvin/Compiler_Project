export class Grammar
{
    m_grammarSet: Set<string> = new Set();
    constructor(inputStr: string)
    {
        let varList = inputStr.split("\n")
        for (let i = 0; i < varList.length - 1; i++)
        {
            let splitList = varList[i].split(" -> ", 2)
            let leftSide = "null"
            let rightSide = "null"
            if (splitList.length == 2)
            {
                leftSide = splitList[0]
                rightSide = splitList[1]
                let terminalRegex = RegExp(rightSide)
                if (this.m_grammarSet.has(leftSide))
                {
                    throw new Error("Error: variable redeclaration " + leftSide)
                }
                this.m_grammarSet.add(leftSide)
                console.log(leftSide + " : " + rightSide);
            }
            else
            {
                throw new Error("Invalid syntax, -> not found with the variable declaration " + varList[i])
            }

            
        }
        
        
    }
}