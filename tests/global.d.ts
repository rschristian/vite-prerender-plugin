type DirectoryResult = import('tmp-promise').DirectoryResult;

declare interface TestEnv {
    tmp: DirectoryResult;
}

declare interface ViteInstance {
    output: string[];
    code: number;
    done: Promise<this['code']>;
}
