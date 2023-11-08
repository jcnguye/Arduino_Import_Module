
import {Cmaker} from './cmaker';

class CmakeBuilder {
    private cmaker: Cmaker;
    
    constructor() {
        this.cmaker = new Cmaker();
    }

    public setProjectDirectory(projDir:string):CmakeBuilder {
        this.cmaker.setProjDir(projDir)
    }

}