import "./Extractedzone.css"

interface ExtractedzoneProps{
    text:string;
}
function Extractedzone({text}: ExtractedzoneProps) {
    return(
        <div className="extractedzone">
            <pre className="extractedcontent">{text}</pre>
        </div>
    );
}

export default Extractedzone;