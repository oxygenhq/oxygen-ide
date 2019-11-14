import FileService from '../../../../app/main/services/FileService';

describe('Service: FileService', () => {
    let service = null;
    beforeAll(() => {
        service = new FileService();
    });
    afterAll(() => { 
        service = null;
    });
    describe('Method: getFilesAndFolders("/")', () => {
        let items = null;
        beforeAll(() => {
            items = service.getFoldersAndFiles('/');
        });
        it('should not return null', () => {
            expect(items).not.toBeNull();
      
        });
        it('should return non-empty array', () => {
            expect(items.length).toBeGreaterThan(0);
        });
        it('should include folder with name "Applications"', () => {
            expect(items).toContain('Applications');
        });
    });
});
