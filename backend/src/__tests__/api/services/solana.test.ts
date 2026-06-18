import solanaService from '../../../api/services/solana';

describe('Solana Service', () => {
  describe('Address Validation', () => {
    it('should validate a valid Solana address', () => {
      const validAddress = '11111111111111111111111111111111';
      expect(solanaService.isValidAddress(validAddress)).toBe(true);
    });

    it('should reject an invalid Solana address', () => {
      const invalidAddress = 'invalid-address';
      expect(solanaService.isValidAddress(invalidAddress)).toBe(false);
    });

    it('should reject an empty address', () => {
      expect(solanaService.isValidAddress('')).toBe(false);
    });
  });

  describe('Message Signature Verification', () => {
    it('should have verifySignature method', () => {
      expect(typeof solanaService.verifySignature).toBe('function');
    });

    it('should reject verification with empty parameters', () => {
      const result = solanaService.verifySignature('', '', '');
      expect(result).toBe(false);
    });
  });

  describe('Balance Retrieval', () => {
    it('should have getBalance method', () => {
      expect(typeof solanaService.getBalance).toBe('function');
    });

    it('should reject invalid address when getting balance', async () => {
      await expect(solanaService.getBalance('invalid')).rejects.toThrow();
    });
  });

  describe('Transaction Creation', () => {
    it('should have createTransferTransaction method', () => {
      expect(typeof solanaService.createTransferTransaction).toBe('function');
    });
  });

  describe('Network Connection', () => {
    it('should have getRecentBlockhash method', () => {
      expect(typeof solanaService.getRecentBlockhash).toBe('function');
    });
  });
});
