'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { FiPlus } from 'react-icons/fi';
import { useCreateDocument } from '@/src/modules/documents/hooks';
import { getApiErrorMessage } from '@/src/shared/api/api-error';

interface CreateDocumentForm {
  title: string;
}

export default function NewDocumentButton() {
  const router = useRouter();
  const createDocument = useCreateDocument();
  const [isOpen, setIsOpen] = useState(false);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateDocumentForm>({ defaultValues: { title: '' } });

  const onSubmit = (values: CreateDocumentForm) => {
    createDocument.mutate(
      { title: values.title, content: '' },
      {
        onSuccess: ({ document }) => {
          reset();
          setIsOpen(false);
          router.push(`/editor?id=${document.id}`);
        },
      },
    );
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="inline-flex w-fit items-center gap-2 rounded-[3px] bg-[#7C6BA6] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#655493] mr-5"
      >
        <FiPlus size={18} />
        Create New File
      </button>

      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={() => setIsOpen(false)}
        >
          <form
            onSubmit={handleSubmit(onSubmit)}
            onClick={(event) => event.stopPropagation()}
            className="w-full max-w-md rounded-[3px] bg-white p-6 shadow-xl"
          >
            <h2 className="text-lg font-semibold text-black">Create new file</h2>
            <input
              {...register('title', { required: 'Title is required.' })}
              autoFocus
              placeholder="Document title"
              className="mt-4 w-full rounded-[3px] border border-gray-200 px-3 py-2 text-sm text-black outline-none placeholder:text-gray-400 focus:border-[#7C6BA6]"
            />
            {errors.title && <p className="mt-1 text-xs text-red-500">{errors.title.message}</p>}
            {createDocument.isError && (
              <p className="mt-1 text-xs text-red-500">
                {getApiErrorMessage(createDocument.error)}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-[3px] px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="rounded-[3px] bg-[#7C6BA6] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#655493] disabled:opacity-50"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
