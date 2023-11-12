
import {Cmaker} from './cmaker';

interface cmakeBuild{
    setProjectDirectory(projectDirectory:string):void;
    setProjectName(projectName:string):void;
    setSourceFile(sourceFile:string):void;
    setCompilerFlag(compilerFlags:string):void;
    setLinkFlags(linkerFlags:string):void;
    build(): Cmaker;
}

class CmakeBuilder implements cmakeBuild{
    private cmaker: Cmaker;
    
    constructor() {
        this.cmaker = new Cmaker();
    }
    
    setProjectName(projectName: string): void {
        this.cmaker.projName = projectName;
    }

    setSourceFile(sourceFile: string): void {
        this.cmaker.srcName = sourceFile;
    }

    setCompilerFlag(compilerFlags: string): void {
        this.cmaker.compilerflags = compilerFlags;
    }

    setLinkFlags(linkerFlags: string): void {
        this.cmaker.linkerflags = linkerFlags;
    }

    build(): Cmaker {
        return this.cmaker;
    }

    setProjectDirectory(projDir:string):void {
        this.cmaker.projDir = projDir;
    }

}
export default CmakeBuilder;
