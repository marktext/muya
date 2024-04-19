import DOMPurify from 'dompurify';
import type { Config } from 'dompurify';

const { sanitize, isValidAttribute } = DOMPurify();

export { isValidAttribute, Config };

export default sanitize;
